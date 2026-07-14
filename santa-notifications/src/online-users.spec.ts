jest.mock('ioredis', () => require('ioredis-mock'));

import Redis from 'ioredis';
import { markOnline, markOffline, isOnline, listOnline, countOnline } from './online-users';

describe('online-users', () => {
  let redis: Redis;

  beforeEach(async () => {
    redis = new Redis();
    await redis.flushall();
  });

  afterEach(async () => {
    await redis.quit();
  });

  it('marks a user online, lists and counts them', async () => {
    await markOnline(redis, 'u1');

    expect(await listOnline(redis)).toEqual(['u1']);
    expect(await countOnline(redis)).toBe(1);
    expect(await isOnline(redis, 'u1')).toBe(1);
  });

  it('is a set — adding the same user twice keeps one entry', async () => {
    await markOnline(redis, 'u1');
    await markOnline(redis, 'u1');

    expect(await countOnline(redis)).toBe(1);
  });

  it('marks a user offline', async () => {
    await markOnline(redis, 'u1');
    await markOffline(redis, 'u1');

    expect(await isOnline(redis, 'u1')).toBe(0);
    expect(await listOnline(redis)).toEqual([]);
  });
});
