import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
    });

    const accessToken = this.sign(user);
    return {
      id: (user._id as object).toString(),
      email: user.email,
      displayName: user.displayName,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    // withPassword: true overrides schema's select: false for this query only
    const user = await this.usersService.findByEmail(dto.email, {
      withPassword: true,
    });

    // Same error for "no account" and "wrong password" — prevents email enumeration
    const isValid =
      user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { accessToken: this.sign(user) };
  }

  private sign(user: { _id: unknown; email: string; role: string }): string {
    return this.jwtService.sign({
      sub: (user._id as object).toString(),
      email: user.email,
      role: user.role,
    });
  }
}
