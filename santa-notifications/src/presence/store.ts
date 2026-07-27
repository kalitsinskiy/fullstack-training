import Redis from 'ioredis';
import type { FastifyBaseLogger } from 'fastify';

export const ONLINE_USERS_KEY = 'online:users';

export function userSocketsKey(userId: string): string {
  return `presence:sockets:${userId}`;
}

export interface PresenceStore {
  markOnline(userId: string): Promise<void>;
  markOffline(userId: string): Promise<void>;
  addConnection(userId: string, socketId: string): Promise<boolean>;
  removeConnection(userId: string, socketId: string): Promise<boolean>;
  isOnline(userId: string): Promise<boolean>;
  listOnline(): Promise<string[]>;
  countOnline(): Promise<number>;
  close(): Promise<void>;
}

class RedisPresenceStore implements PresenceStore {
  constructor(private readonly client: Redis) {}

  async markOnline(userId: string): Promise<void> {
    await this.client.sadd(ONLINE_USERS_KEY, userId);
  }

  async markOffline(userId: string): Promise<void> {
    await this.client.del(userSocketsKey(userId));
    await this.client.srem(ONLINE_USERS_KEY, userId);
  }

  async addConnection(userId: string, socketId: string): Promise<boolean> {
    const [[, total]] = (await this.client
      .multi()
      .sadd(userSocketsKey(userId), socketId)
      .sadd(ONLINE_USERS_KEY, userId)
      .exec()) as [error: Error | null, result: number][];

    return total === 1;
  }

  async removeConnection(userId: string, socketId: string): Promise<boolean> {
    const key = userSocketsKey(userId);
    await this.client.srem(key, socketId);

    if ((await this.client.scard(key)) > 0) return false;

    await this.client.del(key);
    await this.client.srem(ONLINE_USERS_KEY, userId);
    return true;
  }

  async isOnline(userId: string): Promise<boolean> {
    return (await this.client.sismember(ONLINE_USERS_KEY, userId)) === 1;
  }

  listOnline(): Promise<string[]> {
    return this.client.smembers(ONLINE_USERS_KEY);
  }

  countOnline(): Promise<number> {
    return this.client.scard(ONLINE_USERS_KEY);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

class InMemoryPresenceStore implements PresenceStore {
  private readonly online = new Set<string>();
  private readonly sockets = new Map<string, Set<string>>();

  markOnline(userId: string): Promise<void> {
    this.online.add(userId);
    return Promise.resolve();
  }

  markOffline(userId: string): Promise<void> {
    this.sockets.delete(userId);
    this.online.delete(userId);
    return Promise.resolve();
  }

  addConnection(userId: string, socketId: string): Promise<boolean> {
    const socketIds = this.sockets.get(userId) ?? new Set<string>();
    socketIds.add(socketId);
    this.sockets.set(userId, socketIds);
    this.online.add(userId);
    return Promise.resolve(socketIds.size === 1);
  }

  removeConnection(userId: string, socketId: string): Promise<boolean> {
    const socketIds = this.sockets.get(userId);
    if (!socketIds) return Promise.resolve(false);

    socketIds.delete(socketId);
    if (socketIds.size > 0) return Promise.resolve(false);

    this.sockets.delete(userId);
    this.online.delete(userId);
    return Promise.resolve(true);
  }

  isOnline(userId: string): Promise<boolean> {
    return Promise.resolve(this.online.has(userId));
  }

  listOnline(): Promise<string[]> {
    return Promise.resolve([...this.online]);
  }

  countOnline(): Promise<number> {
    return Promise.resolve(this.online.size);
  }

  close(): Promise<void> {
    this.online.clear();
    this.sockets.clear();
    return Promise.resolve();
  }
}

export function createPresenceStore(
  redisUrl: string,
  env: string,
  logger: FastifyBaseLogger
): PresenceStore {
  if (env === 'test') {
    return new InMemoryPresenceStore();
  }

  const client = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
  client.on('connect', () => logger.info({ redisUrl }, 'Connected to Redis'));
  client.on('error', (error: Error) => logger.error({ err: error }, 'Redis connection error'));

  return new RedisPresenceStore(client);
}
