import type { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

jest.mock('ioredis', () => require('ioredis-mock'));

function makeRedis(): RedisService {
  const config = {
    getOrThrow: () => 'redis://localhost:6379',
  } as unknown as ConfigService;
  const service = new RedisService(config);

  service.onModuleInit();

  return service;
}

describe('RedisService', () => {
  it('roud-trips a value with get/set', async () => {
    const redis = makeRedis();

    await redis.set('k', 'v');

    expect(await redis.get('k')).toBe('v');

    await redis.onModuleDestroy();
  });

  it('applies TTL when one is given', async () => {
    const redis = makeRedis();
    await redis.set('t', 'v', 100);
    const ttl = await redis.ttl('t');

    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(100);

    await redis.onModuleDestroy();
  });

  it('del removes a key, get returns null foa a missing key', async () => {
    const redis = makeRedis();
    await redis.set('k', 'v');
    await redis.del('d');

    expect(await redis.get('d')).toBeNull();

    await redis.onModuleDestroy();
  });
});
