import type Redis from 'ioredis';

export interface RedisStore {
  get(key: string): Promise<string | null>;
  setValue(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  ttl(key: string): Promise<number>;
  close(): Promise<void>;
}

export class IoRedisStore implements RedisStore {
  constructor(private readonly client: Redis) {}

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setValue(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds === undefined) {
      await this.client.set(key, value);
    } else {
      await this.client.set(key, value, 'EX', ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

export class InMemoryRedisStore implements RedisStore {
  private readonly entries = new Map<
    string,
    { value: string; expiresAt: number | null }
  >();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.read(key)?.value ?? null);
  }

  setValue(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.entries.set(key, {
      value,
      expiresAt:
        ttlSeconds === undefined ? null : Date.now() + ttlSeconds * 1000,
    });
    return Promise.resolve();
  }

  del(key: string): Promise<void> {
    this.entries.delete(key);
    return Promise.resolve();
  }

  ttl(key: string): Promise<number> {
    const entry = this.read(key);
    if (!entry) return Promise.resolve(-2);
    if (entry.expiresAt === null) return Promise.resolve(-1);
    return Promise.resolve(Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  close(): Promise<void> {
    this.entries.clear();
    return Promise.resolve();
  }

  private read(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }
}
