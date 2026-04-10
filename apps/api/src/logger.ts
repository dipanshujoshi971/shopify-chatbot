import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  messageKey: 'message',
  base: {
    service: 'api',
    env: env.NODE_ENV,
  },
  // Human-readable in dev, raw JSON in production (for CloudWatch)
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        }
      : undefined,
  // Never log secrets
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'accessToken',
      'apiKey',
    ],
    censor: '[REDACTED]',
  },
});