import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from './jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type RegisterResponse = {
  id: string;
  email: string;
  displayName: string;
  accessToken: string;
};

export type LoginResponse = {
  accessToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({
    email,
    password,
    displayName,
  }: RegisterDto): Promise<RegisterResponse> {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email: normalizedEmail,
      displayName,
      passwordHash,
      role: 'user',
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      accessToken: await this.signToken(user.id, user.email, user.role),
    };
  }

  async login({ email, password }: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email.toLowerCase(), {
      withPassword: true,
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: await this.signToken(
        user._id.toString(),
        user.email,
        user.role,
      ),
    };
  }

  private signToken(
    userId: string,
    email: string,
    role: 'user' | 'admin',
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.signAsync(payload);
  }
}
