import { Queue, type QueueOptions } from 'bullmq';
import { valkey } from '../valkey.js';

const queues = new Map<string, Queue>();

/**
 * Returns a shared BullMQ Queue instance for the given name.
 * Reuses the existing Valkey (ioredis) singleton as the connection.
 */
export function getQueue(name: string, opts?: Omit<QueueOptions, 'connection'>): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { ...opts, connection: valkey });
    queues.set(name, queue);
  }
  return queue;
}

/** Close all cached queues. Called during graceful shutdown. */
export async function closeAllQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
}
