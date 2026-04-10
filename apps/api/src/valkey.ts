import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

// ioredis works with Valkey out of the box — same protocol
export const valkey = new Redis(env.VALKEY_URL, {
  maxRetriesPerRequest: 3,     // retry failed commands 3 times
  enableReadyCheck: true,      // wait until Valkey is ready before sending commands
  lazyConnect: true,           // don't connect until we call .connect()
});

valkey.on('connect', () => {
  logger.info('Valkey connected');
});

valkey.on('error', (err) => {
  logger.error({ err }, 'Valkey error');
});

valkey.on('reconnecting', () => {
  logger.warn('Valkey reconnecting...');
});