import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { env } from './env.js';
import { logger } from './logger.js';
import { valkey } from './valkey.js';

const app = Fastify({
  loggerInstance: logger,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  // Runs when Fastify creates a logger for each request
  // tenant_id gets baked into ALL logs for that request
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

// ─── Health Routes ────────────────────────────────────────────────────────────

// ALB uses this to know the container is alive
// Returns 200 as soon as HTTP server is listening
app.get('/healthz', async () => {
  return { status: 'ok' };
});

// ALB uses this before routing traffic
// Checks real dependencies are reachable
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
  // Connect Valkey before accepting traffic
  await valkey.connect();

  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(`Server running on port ${env.PORT}`);
} catch (err) {
  logger.error(err, 'Server failed to start');
  process.exit(1);
}