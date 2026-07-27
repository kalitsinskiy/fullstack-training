import Redis from 'ioredis';
import type { FastifyBaseLogger } from 'fastify';

export const ONLINE_USERS_KEY = 'online:users';

export interface PresenceStore {
  markOnline(userId: string): Promise<void>;
  markOffline(userId: string): Promise<void>;
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
    await this.client.srem(ONLINE_USERS_KEY, userId);
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

  markOnline(userId: string): Promise<void> {
    this.online.add(userId);
    return Promise.resolve();
  }

  markOffline(userId: string): Promise<void> {
    this.online.delete(userId);
    return Promise.resolve();
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
