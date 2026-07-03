import { JwtService } from '@nestjs/jwt';

export function tokenFor(
  jwt: JwtService,
  user: { _id: { toString(): string } | string; email: string; role?: string },
): string {
  return jwt.sign({
    sub: user._id.toString(),
    email: user.email,
    role: user.role ?? 'user',
  });
}
