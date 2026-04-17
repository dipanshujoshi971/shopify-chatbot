import fp from 'fastify-plugin';
import crypto from 'node:crypto';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { valkey } from '../valkey.js';
import { env } from '../env.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

/**
 * Handshake shape.
 *
 * Widget path (default, backwards-compatible):
 *   { tenantId, sessionId }
 *
 * Dashboard path (authenticated merchant watching their own tenant):
 *   { role: 'dashboard', ticket }
 *   — ticket is a `base64url(payload).base64url(hmac)` string minted by the
 *     dashboard's /api/realtime/ticket route using INTERNAL_HMAC_SECRET.
 *     Payload = JSON { tenantId, exp } where exp is a unix ms timestamp.
 */
interface SocketHandshakeAuth {
  role?: 'widget' | 'dashboard' | 'admin';
  tenantId?: string;
  sessionId?: string;
  ticket?: string;
}

interface DashboardTicketPayload {
  tenantId: string;
  exp: number;
}

interface AdminTicketPayload {
  adminUserId: string;
  exp: number;
  kind: 'admin';
}

/**
 * Verify a dashboard ticket: constant-time HMAC check, then payload parse
 * and expiry check. Returns the tenantId on success, null otherwise.
 */
function verifyDashboardTicket(ticket: string): string | null {
  const parts = ticket.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  const expectedSig = crypto
    .createHmac('sha256', env.INTERNAL_HMAC_SECRET)
    .update(payloadB64)
    .digest();

  let providedSig: Buffer;
  try {
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return null;
  }

  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(providedSig, expectedSig)
  ) {
    return null;
  }

  let payload: DashboardTicketPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload.tenantId !== 'string' ||
    typeof payload.exp !== 'number' ||
    payload.exp < Date.now()
  ) {
    return null;
  }

  return payload.tenantId;
}

/**
 * Verify an admin ticket. Shares the same signing scheme as the dashboard
 * ticket but the payload must carry `kind: 'admin'` so a merchant's dashboard
 * ticket can't be promoted into an admin one.
 */
function verifyAdminTicket(ticket: string): string | null {
  const parts = ticket.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  const expectedSig = crypto
    .createHmac('sha256', env.INTERNAL_HMAC_SECRET)
    .update(payloadB64)
    .digest();

  let providedSig: Buffer;
  try {
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return null;
  }

  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(providedSig, expectedSig)
  ) {
    return null;
  }

  let payload: AdminTicketPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (
    !payload ||
    payload.kind !== 'admin' ||
    typeof payload.adminUserId !== 'string' ||
    typeof payload.exp !== 'number' ||
    payload.exp < Date.now()
  ) {
    return null;
  }

  return payload.adminUserId;
}

const socketPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const pubClient = valkey.duplicate();
  const subClient = valkey.duplicate();

  // FIX: Because valkey uses lazyConnect: true, we MUST tell the duplicates to connect
  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  fastify.log.info('Valkey pub/sub clients ready for Socket.io adapter');

  const io = new Server(fastify.server, {
    adapter: createAdapter(pubClient, subClient),
    cors: {
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    pingInterval: 25_000,
    pingTimeout:  20_000,
    cookie: {
      name:     'io',
      httpOnly: true,
      sameSite: 'strict',
      secure:   env.NODE_ENV === 'production',
    },
    path: '/socket.io/',
  });

  fastify.decorate('io', io);

  io.use((socket: Socket, next) => {
    const auth = socket.handshake.auth as SocketHandshakeAuth;

    // Admin path — super admin listening on admin:global.
    if (auth.role === 'admin') {
      if (!auth.ticket || typeof auth.ticket !== 'string') {
        return next(new Error('AUTH_MISSING_TICKET'));
      }
      const adminUserId = verifyAdminTicket(auth.ticket);
      if (!adminUserId) return next(new Error('AUTH_INVALID_TICKET'));

      socket.data.role = 'admin';
      socket.data.adminUserId = adminUserId;
      return next();
    }

    // Dashboard path — ticket-authenticated merchant listening to their own
    // tenant room. No sessionId required.
    if (auth.role === 'dashboard') {
      if (!auth.ticket || typeof auth.ticket !== 'string') {
        return next(new Error('AUTH_MISSING_TICKET'));
      }
      const tenantId = verifyDashboardTicket(auth.ticket);
      if (!tenantId) return next(new Error('AUTH_INVALID_TICKET'));

      socket.data.role      = 'dashboard';
      socket.data.tenantId  = tenantId;
      return next();
    }

    // Widget path (default) — unchanged for backwards compatibility.
    const { tenantId, sessionId } = auth;
    if (!tenantId || typeof tenantId !== 'string') {
      return next(new Error('AUTH_MISSING_TENANT_ID'));
    }
    if (!sessionId || typeof sessionId !== 'string') {
      return next(new Error('AUTH_MISSING_SESSION_ID'));
    }

    socket.data.role      = 'widget';
    socket.data.tenantId  = tenantId;
    socket.data.sessionId = sessionId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const { role, tenantId, sessionId, adminUserId } = socket.data as {
      role: 'widget' | 'dashboard' | 'admin';
      tenantId?: string;
      sessionId?: string;
      adminUserId?: string;
    };

    const logger = fastify.log.child({
      role,
      tenant_id:  tenantId,
      session_id: sessionId,
      admin_user_id: adminUserId,
      socket_id:  socket.id,
    });

    logger.info('socket connected');

    if (role === 'admin') {
      socket.join('admin:global');
    } else if (tenantId) {
      const tenantRoom = `tenant:${tenantId}`;
      socket.join(tenantRoom);

      // Widget sockets also join their per-session room so we can target them
      // directly. Dashboard sockets only listen at the tenant level.
      if (role === 'widget' && sessionId) {
        socket.join(`tenant:${tenantId}:session:${sessionId}`);
      }
    }

    socket.on('disconnect', (reason) => {
      logger.info({ reason }, 'socket disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ err }, 'socket error');
    });
  });

  fastify.addHook('onClose', async () => {
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await Promise.all([pubClient.quit(), subClient.quit()]);
    fastify.log.info('socket.io and valkey pub/sub clients shut down cleanly');
  });
};

export const socketIoPlugin = fp(socketPlugin, {
  name:    'socket-io',
  fastify: '5.x',
});