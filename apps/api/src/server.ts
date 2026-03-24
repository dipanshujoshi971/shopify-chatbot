import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { env } from './env.js';
import { logger } from './logger.js';
import { valkey } from './valkey.js';
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhooks.js';

const app = Fastify({
  loggerInstance: logger,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  // Bakes tenant_id into every log line for that request.
  // In Phase 2 this will switch from header to decoded JWT.
  childLoggerFactory: (logger, bindings, opts, rawReq) => {
    const tenantId =
      (rawReq as any).headers?.['x-tenant-id'] ?? 'unknown';
    return logger.child({ ...bindings, tenant_id: tenantId });
  },
});

// ─── Plugins ──────────────────────────────────────────────────────────────────

await app.register(helmet);

await app.register(cors, {
  origin: env.ALLOWED_ORIGINS.split(','),
  credentials: true,
});

// ─── Routes ───────────────────────────────────────────────────────────────────

await app.register(authRoutes);

// Webhook routes need raw body access for HMAC verification.
// They register their own JSON content type parser scoped to this plugin.
await app.register(webhookRoutes);

// ─── Health Routes ────────────────────────────────────────────────────────────

// ALB uses /healthz to know the container exists (no dependency checks)
app.get('/healthz', async () => {
  return { status: 'ok' };
});

// ALB uses /readyz before routing traffic — checks actual dependencies
app.get('/readyz', async (request, reply) => {
  try {
    const result = await valkey.ping();
    if (result === 'PONG') {
      return { status: 'ok', valkey: 'ok' };
    }
    throw new Error('Unexpected ping response');
  } catch (err) {
    logger.error({ err }, 'Readyz check failed');
    reply.code(503);
    return { status: 'error', valkey: 'unreachable' };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await valkey.connect();
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(`Server running on port ${env.PORT}`);
} catch (err) {
  logger.error(err, 'Server failed to start');
  process.exit(1);
}