import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const LIMIT = 5;
const WINDOW_SECONDS = 60;

/**
 * Stricter, Redis-backed rate limit for the auth endpoints (login/register):
 * LIMIT attempts per IP per WINDOW. This is in addition to the global
 * ThrottlerModule — auth is the highest-value target for brute force.
 *
 * Disabled under NODE_ENV=test so the suite (many auth calls from one IP) runs.
 */
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ ip?: string }>();
    const ip: string = request.ip ?? 'unknown';
    const count = await this.redis.incrWithTtl(
      `ratelimit:auth:${ip}`,
      WINDOW_SECONDS,
    );
    if (count > LIMIT) {
      throw new HttpException(
        'Too many authentication attempts, try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
