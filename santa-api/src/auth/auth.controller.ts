import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import RegisterDto from './dto/register.dto';
import LoginDto from './dto/login.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: String,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data', type: String })
  @ApiParam({
    name: 'dto',
    description: 'Registration data (username, password, etc.)',
    type: RegisterDto,
  })
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login and receive a JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, JWT token returned',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials',
    type: String,
  })
  @ApiParam({
    name: 'dto',
    description: 'Login data (username and password)',
    type: LoginDto,
  })
  @Throttle({ default: { limit: 50, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
