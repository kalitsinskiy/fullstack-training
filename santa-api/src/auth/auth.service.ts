import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
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
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const userEmail = dto.email.toLowerCase().trim();

    const ifUserExists = await this.usersService.findByEmail(userEmail);

    if (ifUserExists) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.usersService.create({
      email: userEmail,
      displayName: dto.displayName,
      passwordHash,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: newUser.id,
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      accessToken: accessToken,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const userEmail = dto.email.toLowerCase().trim();

    const user = await this.usersService.findByEmail(userEmail, {
      withPassword: true,
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: accessToken,
    };
  }
}
