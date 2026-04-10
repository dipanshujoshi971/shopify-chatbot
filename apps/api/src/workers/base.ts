import { Worker, type Processor, type WorkerOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../env.js';
import { logger } from '../logger.js';

const DEFAULT_CONCURRENCY = 5;

/**
 * Creates a BullMQ Worker with standardized defaults.
 * Uses a dedicated Redis connection with maxRetriesPerRequest: null
 * as required by BullMQ workers.
 */
export function createWorker<T = unknown, R = unknown>(
  queueName: string,
  processor: Processor<T, R>,
  opts?: Omit<WorkerOptions, 'connection'>,
): Worker<T, R> {
  const connection = new Redis(env.VALKEY_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  const worker = new Worker<T, R>(queueName, processor, {
    concurrency: DEFAULT_CONCURRENCY,
    ...opts,
    connection,
  });

  const log = logger.child({ worker: queueName });

  worker.on('ready', () => log.info('worker ready'));
  worker.on('completed', (job) => log.debug({ jobId: job.id }, 'job completed'));
  worker.on('failed', (job, err) =>
    log.error({ jobId: job?.id, err }, 'job failed'),
  );
  worker.on('error', (err) => log.error({ err }, 'worker error'));

  return worker;
}
