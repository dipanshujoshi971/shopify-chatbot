import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { env } from './env.js';
import { logger } from './logger.js';
import 'dotenv/config';

const app = Fastify({
  loggerInstance: logger,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
});

// ─── Plugins ──────────────────────────────────────────────────────────────────

await app.register(helmet);

await app.register(cors, {
  origin: env.ALLOWED_ORIGINS.split(','),
  credentials: true,
});

// ─── Health Routes ────────────────────────────────────────────────────────────

// ALB uses this to know the container is alive
// Returns 200 as soon as the HTTP server is listening
app.get('/healthz', async () => {
  return { status: 'ok' };
});

// ALB uses this before routing traffic to the container
// Checks that DB and Valkey connections are working
app.get('/readyz', async (request, reply) => {
  // TODO: add real DB and Valkey checks in Phase 2
  return { status: 'ok' };
});

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(`Server running on port ${env.PORT}`);
} catch (err) {
  logger.error(err, 'Server failed to start');
  process.exit(1);
}