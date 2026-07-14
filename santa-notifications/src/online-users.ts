import type Redis from 'ioredis';

const ONLINE_KEY = 'online:users';

export const markOnline = (redis: Redis, userId: string): Promise<number> =>
  redis.sadd(ONLINE_KEY, userId);

export const markOffline = (redis: Redis, userId: string): Promise<number> =>
  redis.srem(ONLINE_KEY, userId);

export const isOnline = (redis: Redis, userId: string): Promise<number> =>
  redis.sismember(ONLINE_KEY, userId);

export const listOnline = (redis: Redis): Promise<string[]> => redis.smembers(ONLINE_KEY);

export const countOnline = (redis: Redis): Promise<number> => redis.scard(ONLINE_KEY);
