import { Injectable, NotImplementedException } from '@nestjs/common';
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

  // TODO (Kickoff / Auth): reject a duplicate email, hash the password with bcrypt,
  // create the user via UsersService, and return the user plus a signed JWT.
  register(dto: RegisterDto): Promise<RegisterResponse> {
    throw new NotImplementedException(
      'AuthService.register is not implemented',
    );
  }

  // TODO (Kickoff / Auth): look up the user by email (with password hash), verify the
  // password with bcrypt.compare, and return a signed JWT. Throw UnauthorizedException
  // on any mismatch — never reveal which field was wrong.
  login(dto: LoginDto): Promise<LoginResponse> {
    throw new NotImplementedException('AuthService.login is not implemented');
  }
}
