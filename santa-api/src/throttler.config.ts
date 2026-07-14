import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

export function buildThrottlerOptions(
  redisUrl: string,
  nodeEnv: string,
): ThrottlerModuleOptions {
  const isTest = nodeEnv === 'test';

  return {
    throttlers: [{ ttl: 60_000, limit: 100 }],
    storage: isTest ? undefined : new ThrottlerStorageRedisService(redisUrl),
    skipIf: () => isTest,
  };
}
