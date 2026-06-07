import { JwtService } from '@nestjs/jwt';

export function tokenFor(
  jwt: JwtService,
  user: { _id: string; email: string; role?: string },
) {
  return jwt.sign({
    sub: user._id.toString(),
    email: user.email,
    role: user.role ?? 'user',
  });
}
