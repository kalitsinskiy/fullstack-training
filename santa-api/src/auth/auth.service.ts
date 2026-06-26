import {
  ConflictException,
  Injectable,
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

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Reject a duplicate email, hash the password, create the user, return user + JWT.
  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
    });
    const accessToken = this.signToken(user.id, user.email, user.role);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      accessToken,
    };
  }

  // Verify credentials with bcrypt; never reveal which field was wrong.
  async login(dto: LoginDto): Promise<LoginResponse> {
    const doc = await this.usersService.findByEmail(dto.email, {
      withPassword: true,
    });
    if (!doc) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, doc.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      accessToken: this.signToken(doc._id.toString(), doc.email, doc.role),
    };
  }

  private signToken(
    sub: string,
    email: string,
    role: 'user' | 'admin',
  ): string {
    return this.jwtService.sign({ sub, email, role });
  }
}
