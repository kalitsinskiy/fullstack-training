import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class ServiceKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();
    const provided = request.headers['x-service-key'];
    const expected = this.config.getOrThrow<string>('SERVICE_API_KEY');

    if (!provided || !this.safeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid service key');
    }

    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);

    if (ab.length !== bb.length) {
      return false;
    }

    return timingSafeEqual(ab, bb);
  }
}
