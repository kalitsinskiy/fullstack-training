jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

import Redis from 'ioredis';
import { markOnline, markOffline, isOnline, listOnline, countOnline } from './online-users';

describe('online-users (ref-counted presence)', () => {
  let redis: Redis;

  beforeEach(async () => {
    redis = new Redis();
    await redis.flushall();
  });

  afterEach(async () => {
    await redis.quit();
  });

  it('marks online on the first connection, lists + counts', async () => {
    expect(await markOnline(redis, 'u1')).toBe(true);
    expect(await isOnline(redis, 'u1')).toBe(true);
    expect(await listOnline(redis)).toEqual(['u1']);
    expect(await countOnline(redis)).toBe(1);
  });

  it('stays online while a second connection is open (multi-tab)', async () => {
    await markOnline(redis, 'u1');

    expect(await markOnline(redis, 'u1')).toBe(false);
    expect(await markOffline(redis, 'u1')).toBe(false);
    expect(await isOnline(redis, 'u1')).toBe(true);
    expect(await countOnline(redis)).toBe(1);
  });

  it('goes offline only when the last connection drops', async () => {
    await markOnline(redis, 'u1');
    await markOnline(redis, 'u1');
    await markOffline(redis, 'u1');

    expect(await markOffline(redis, 'u1')).toBe(true);
    expect(await isOnline(redis, 'u1')).toBe(false);
    expect(await listOnline(redis)).toEqual([]);
  });
});
