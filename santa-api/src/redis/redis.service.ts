import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private memStore = new Map<string, string>();
  private memSets = new Map<string, Set<string>>();

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(RedisService.name)
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.client = new Redis(this.configService.get<string>('REDIS_URL')!);
    this.client.on('connect', () => this.logger.info('Redis connected'));
    this.client.on('error', (err) => this.logger.error({ err }, 'Redis error'));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return this.memStore.get(key) ?? null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      this.memStore.set(key, value);
      return;
    }
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      this.memStore.delete(key);
      return;
    }
    await this.client.del(key);
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    if (!this.client) {
      const s = this.memSets.get(key) ?? new Set<string>();
      members.forEach((m) => s.add(m));
      this.memSets.set(key, s);
      return;
    }
    await this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    if (!this.client) {
      const s = this.memSets.get(key);
      if (s) members.forEach((m) => s.delete(m));
      return;
    }
    await this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client) return [...(this.memSets.get(key) ?? [])];
    return this.client.smembers(key);
  }
}
