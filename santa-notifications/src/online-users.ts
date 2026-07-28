import type Redis from 'ioredis';

const ONLINE_KEY = 'online:users';

export async function markOnline(redis: Redis, userId: string): Promise<boolean> {
  const count = await redis.hincrby(ONLINE_KEY, userId, 1);
  return count === 1;
}

export async function markOffline(redis: Redis, userId: string): Promise<boolean> {
  const count = await redis.hincrby(ONLINE_KEY, userId, -1);

  if (count <= 0) {
    await redis.hdel(ONLINE_KEY, userId);
    return true;
  }

  return false;
}

export async function isOnline(redis: Redis, userId: string): Promise<boolean> {
  const count = await redis.hget(ONLINE_KEY, userId);
  return count !== null && Number(count) > 0;
}

export const listOnline = (redis: Redis): Promise<string[]> => redis.hkeys(ONLINE_KEY);

export const countOnline = (redis: Redis): Promise<number> => redis.hlen(ONLINE_KEY);
