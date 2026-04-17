import crypto from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../env.js';

// Only these room patterns may be targeted by the dashboard, so a
// misconfigured caller can't broadcast into arbitrary rooms.
const ROOM_RE = /^(tenant:[A-Za-z0-9_-]+|admin:global)$/;

// Optional loopback allowlist in production. When NODE_ENV=production we only
// accept connections whose remote address is loopback — in prod the api and
// dashboard run on the same box and dashboard→api hops via localhost.
function isLoopback(ip: string | undefined): boolean {
  if (!ip) return false;
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

const INTERNAL_CONTENT_TYPE = 'application/x-internal-emit';

const internalRoutes: FastifyPluginAsync = async (app) => {
  // Accept a custom content-type so Fastify hands us the raw string body
  // verbatim — we need the exact bytes the sender signed for HMAC to match.
  // Using a non-JSON content-type keeps this parser isolated from the rest
  // of the app's routes.
  app.addContentTypeParser(
    INTERNAL_CONTENT_TYPE,
    { parseAs: 'string' },
    (_req, body, done) => {
      done(null, body);
    },
  );

  app.post('/internal/emit', async (req, reply) => {
    if (env.NODE_ENV === 'production' && !isLoopback(req.ip)) {
      reply.code(403);
      return { error: 'forbidden' };
    }

    if (typeof req.body !== 'string') {
      reply.code(415);
      return { error: `expected Content-Type: ${INTERNAL_CONTENT_TYPE}` };
    }

    const raw = req.body;

    const sigHeader = req.headers['x-internal-signature'];
    if (!sigHeader || typeof sigHeader !== 'string') {
      reply.code(401);
      return { error: 'missing signature' };
    }

    const expected = crypto
      .createHmac('sha256', env.INTERNAL_HMAC_SECRET)
      .update(raw)
      .digest();

    let provided: Buffer;
    try {
      provided = Buffer.from(sigHeader, 'base64url');
    } catch {
      reply.code(401);
      return { error: 'bad signature encoding' };
    }

    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      reply.code(401);
      return { error: 'invalid signature' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      reply.code(400);
      return { error: 'invalid json' };
    }
    const { room, event, payload } = parsed as {
      room?: string;
      event?: string;
      payload?: unknown;
    };

    if (!room || !ROOM_RE.test(room)) {
      reply.code(400);
      return { error: 'invalid room' };
    }
    if (!event || typeof event !== 'string' || event.length > 64) {
      reply.code(400);
      return { error: 'invalid event' };
    }

    app.io.to(room).emit(event, payload);
    reply.code(204);
    return;
  });
};

export default internalRoutes;
