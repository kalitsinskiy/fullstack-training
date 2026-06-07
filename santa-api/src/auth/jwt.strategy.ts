import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    // in a real app, you might want to validate the user exists in the database here
    // const user = await this.usersService.findById(payload.sub);
    await new Promise((resolve) => setTimeout(resolve, 1));

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
