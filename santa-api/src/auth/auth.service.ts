import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type RegisterResponse = { id: string; email: string; displayName: string; accessToken: string; };
export type LoginResponse = { accessToken: string; };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ email: dto.email, displayName: dto.displayName, passwordHash });
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return { id: user.id, email: user.email, displayName: user.displayName, accessToken };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(dto.email, { withPassword: true });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    const accessToken = this.jwtService.sign({ sub: user.id as string, email: user.email, role: user.role });
    return { accessToken };
  }
}
