import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: unknown, user: T, info: unknown): T {
    if (err || !user) {
      const authInfo = info as { message?: string } | undefined;

      throw new UnauthorizedException(
        authInfo?.message ?? 'Authentication required',
      );
    }
    return user;
  }
}
