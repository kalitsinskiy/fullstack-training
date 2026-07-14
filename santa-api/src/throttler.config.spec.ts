jest.mock('ioredis', () => require('ioredis-mock'));

import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { buildThrottlerOptions } from './throttler.config';

describe('buildThrottlerOptions', () => {
  it('uses in-memory storage and skips throttling under test', () => {
    const opts = buildThrottlerOptions('redis://localhost:6379', 'test');

    expect(opts.storage).toBeUndefined();
    expect(opts.skipIf?.({})).toBe(true);
  });

  it('uses Redis storage and enforces throttling in production', () => {
    const opts = buildThrottlerOptions('redis://localhost:6379', 'production');

    expect(opts.storage).toBeInstanceOf(ThrottlerStorageRedisService);
    expect(opts.skipIf?.({})).toBe(false);
  });
});
