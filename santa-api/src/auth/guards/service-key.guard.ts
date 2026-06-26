import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service-to-service auth: accepts a request only if it carries the shared
 * X-Service-Key header matching SERVICE_API_KEY. Used for /internal endpoints
 * that santa-notifications calls (no user JWT involved).
 */
@Injectable()
export class ServiceKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const key = request.headers['x-service-key'];
    if (key && key === this.config.get<string>('SERVICE_API_KEY')) {
      return true;
    }
    throw new UnauthorizedException('Invalid service key');
  }
}
