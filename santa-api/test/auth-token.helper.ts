import { JwtService } from '@nestjs/jwt';

// Sign a JWT using the same secret as the app — read it from the test config.
// Generating tokens directly (rather than calling POST /auth/login each time)
// keeps integration tests fast and isolated from the auth flow itself.
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
