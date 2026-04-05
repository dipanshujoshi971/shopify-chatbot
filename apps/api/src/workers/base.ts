import { Worker, type Processor, type WorkerOptions } from 'bullmq';
import { valkey } from '../valkey.js';
import { logger } from '../logger.js';

const DEFAULT_CONCURRENCY = 5;

/**
 * Creates a BullMQ Worker with standardized defaults.
 * Reuses the existing Valkey singleton and Pino logger.
 */
export function createWorker<T = unknown, R = unknown>(
  queueName: string,
  processor: Processor<T, R>,
  opts?: Omit<WorkerOptions, 'connection'>,
): Worker<T, R> {
  const worker = new Worker<T, R>(queueName, processor, {
    concurrency: DEFAULT_CONCURRENCY,
    ...opts,
    connection: valkey,
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
