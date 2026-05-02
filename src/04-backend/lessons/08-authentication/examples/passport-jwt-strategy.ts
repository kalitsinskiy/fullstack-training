// ============================================
// NestJS Passport JWT Strategy
// ============================================
// This file is for reading/understanding — it runs inside a NestJS application.
// Copy and adapt these patterns for the App Task.

// --- 1. Install dependencies ---
// npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
// npm install -D @types/passport-jwt @types/bcrypt

// --- 2. JWT Strategy ---

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// This interface represents the JWT payload shape
interface JwtPayload {
  sub: string;    // user ID
  email: string;
  role: string;
}

// This interface represents what gets attached to request.user
interface UserPayload {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract JWT from the Authorization header: "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens (default: false, but be explicit)
      ignoreExpiration: false,

      // Secret key to verify the signature
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-change-me',
    });
  }

  /**
   * Called after Passport verifies the JWT signature and expiration.
   * The return value is attached to request.user.
   *
   * If you throw an exception here, the request is rejected with 401.
   */
  async validate(payload: JwtPayload): Promise<UserPayload> {
    // You could do additional checks here:
    // - Is the user still active in the database?
    // - Has the user's role changed since the token was issued?
    // - Is this token in a blacklist (for logout)?

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

// --- 3. Auth Module setup ---

/*
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
      signOptions: { expiresIn: '1h' },
    }),
    // UsersModule, // import to access UsersService
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
*/

// --- 4. Auth Service ---

/*
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, displayName } = dto;

    // Check if user already exists
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.usersService.create({ email, passwordHash, displayName });

    // Generate JWT
    const accessToken = this.generateToken(user);
    return { accessToken };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    // Find user with password hash
    const user = await this.usersService.findByEmail(email, { withPassword: true });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const accessToken = this.generateToken(user);
    return { accessToken };
  }

  private generateToken(user: { _id: string; email: string; role: string }): string {
    return this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
  }
}
*/

export {};
