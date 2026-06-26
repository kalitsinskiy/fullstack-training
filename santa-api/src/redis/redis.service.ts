import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error(err.message));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** INCR + set TTL on first hit. Returns the current count (for rate limiting). */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  // Set helpers (online-user tracking, etc.)
  async sadd(key: string, member: string): Promise<void> {
    await this.client.sadd(key, member);
  }
  async srem(key: string, member: string): Promise<void> {
    await this.client.srem(key, member);
  }
  smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }
}
