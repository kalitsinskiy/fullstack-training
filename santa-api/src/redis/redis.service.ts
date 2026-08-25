import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  InMemoryRedisStore,
  IoRedisStore,
  type RedisStore,
} from './redis.store';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private store: RedisStore = new InMemoryRedisStore();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (this.configService.get<string>('NODE_ENV') === 'test') {
      this.logger.log('NODE_ENV=test — using the in-memory Redis store');
      return;
    }

    const url = this.configService.getOrThrow<string>('REDIS_URL');
    const client = new Redis(url, { maxRetriesPerRequest: 3 });

    client.on('connect', () => this.logger.log(`Connected to Redis (${url})`));
    client.on('error', (error: Error) =>
      this.logger.error(`Redis connection error: ${error.message}`),
    );

    this.store = new IoRedisStore(client);
  }

  async onModuleDestroy(): Promise<void> {
    await this.store.close();
    this.logger.log('Redis connection closed');
  }

  get(key: string): Promise<string | null> {
    return this.store.get(key);
  }

  set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    return this.store.setValue(key, value, ttlSeconds);
  }

  del(key: string): Promise<void> {
    return this.store.del(key);
  }

  ttl(key: string): Promise<number> {
    return this.store.ttl(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Discarding unparseable cache entry at ${key}`);
      await this.del(key);
      return null;
    }
  }

  setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }
}
