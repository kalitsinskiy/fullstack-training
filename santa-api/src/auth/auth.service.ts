import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const email = dto.email.toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email,
      displayName: dto.displayName,
      passwordHash,
      role: 'user',
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      accessToken,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const email = dto.email.toLowerCase();
    const user = await this.usersService.findByEmail(email, {
      withPassword: true,
    });
    if (!user) {
      this.logger.warn(`Login failed: no account for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Login failed: wrong password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
    });

    return { accessToken };
  }
}
