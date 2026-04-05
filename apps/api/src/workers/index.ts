/**
 * Worker process entry point — run separately from the Fastify server.
 *
 *   npm run worker          (or tsx watch src/workers/index.ts)
 *
 * Register workers by importing them below. Each module should call
 * createWorker() and export the resulting Worker instance.
 */

import { valkey } from '../valkey.js';
import { logger } from '../logger.js';
import { closeAllQueues } from '../lib/queue.js';
import type { Worker } from 'bullmq';

// ── Register workers here ───────────────────────────────────
import { knowledgeEmbedWorker } from './knowledge-embed.js';

const workers: Worker[] = [
  knowledgeEmbedWorker,
];
// ─────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  await valkey.connect();
  logger.info({ count: workers.length }, 'all workers started');
}

async function shutdown(): Promise<void> {
  logger.info('shutting down workers…');
  await Promise.all(workers.map((w) => w.close()));
  await closeAllQueues();
  await valkey.quit();
  logger.info('shutdown complete');
}

process.on('SIGTERM', () => void shutdown().then(() => process.exit(0)));
process.on('SIGINT', () => void shutdown().then(() => process.exit(0)));

start().catch((err) => {
  logger.fatal({ err }, 'worker startup failed');
  process.exit(1);
});
