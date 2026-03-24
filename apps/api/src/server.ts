import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { env } from './env.js';
import { logger } from './logger.js';
import { valkey } from './valkey.js';
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhooks.js';
import { socketIoPlugin } from './plugins/socket.js'; // <-- Added import

const app = Fastify({
  loggerInstance: logger,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
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

// Register Socket.io before routes, so auth/webhooks could potentially use app.io
await app.register(socketIoPlugin);

// ─── Routes ───────────────────────────────────────────────────────────────────

await app.register(authRoutes);
await app.register(webhookRoutes);

// ─── Health Routes ────────────────────────────────────────────────────────────

app.get('/healthz', async () => {
  return { status: 'ok' };
});

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
  await valkey.connect(); // Connects the main Valkey instance
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(`Server running on port ${env.PORT}`);
} catch (err) {
  logger.error(err, 'Server failed to start');
  process.exit(1);
}