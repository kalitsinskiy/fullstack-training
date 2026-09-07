import type {
  ThrottlerModuleOptions,
  ThrottlerOptions,
} from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

type ThrottlerObjectOptions = Exclude<
  ThrottlerModuleOptions,
  ThrottlerOptions[]
>;

export function buildThrottlerOptions(
  redisUrl: string,
  nodeEnv: string,
): ThrottlerObjectOptions {
  const isTest = nodeEnv === 'test';

  return {
    throttlers: [{ ttl: 60_000, limit: 100 }],
    storage: isTest ? undefined : new ThrottlerStorageRedisService(redisUrl),
    skipIf: () => isTest,
  };
}
