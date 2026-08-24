import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(
    err: unknown,
    user: T,
    info: { message?: string } | undefined,
  ): T {
    if (err || !user) {
      const message = info?.message ?? 'Authentication required';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
