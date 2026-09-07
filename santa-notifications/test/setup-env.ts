import { randomBytes } from 'node:crypto';

/**
 * Test env defaults, applied before any spec runs (jest `setupFiles`). The config
 * plugin requires these, and app-building specs boot the real app. Secrets are
 * generated per run — never hardcoded — and only set if the runner hasn't already.
 */
process.env.JWT_SECRET ??= randomBytes(24).toString('hex');
process.env.SERVICE_API_KEY ??= randomBytes(24).toString('hex');
process.env.SANTA_API_URL ??= 'http://localhost:3001';

process.env.NODE_ENV ??= 'test';

process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.RABBITMQ_URL ??= 'amqp://localhost:5672';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';
