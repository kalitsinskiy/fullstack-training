// jest.mock is hoisted above imports by Jest
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'create'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    jest.clearAllMocks();
    // Restore the sign mock after clearAllMocks
    (jwtService.sign as jest.Mock).mockReturnValue('mock-token');
  });

  describe('register()', () => {
    const registerDto = {
      email: 'Test@Test.com',
      password: 'password123',
      displayName: 'Test User',
    };

    const mockUser = {
      _id: { toString: () => 'user-id' },
      email: 'test@test.com',
      displayName: 'Test User',
      role: 'user' as const,
    };

    beforeEach(() => {
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('$hashed');
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue(mockUser);
    });

    it('calls bcrypt.hash before creating the user', async () => {
      await service.register(registerDto);
      expect(mockBcrypt.hash).toHaveBeenCalled();
    });

    it('returns { id, email, displayName, accessToken }', async () => {
      const result = await service.register(registerDto);
      expect(result).toMatchObject({
        id: 'user-id',
        email: 'test@test.com',
        displayName: 'Test User',
        accessToken: 'mock-token',
      });
    });

    it('throws ConflictException on duplicate email', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login()', () => {
    const loginDto = { email: 'test@test.com', password: 'password123' };

    const mockUser = {
      _id: { toString: () => 'user-id' },
      email: 'test@test.com',
      passwordHash: '$hashed',
      role: 'user' as const,
    };

    it('returns accessToken on valid credentials', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);
      expect(result).toHaveProperty('accessToken', 'mock-token');
    });

    it('throws UnauthorizedException("Invalid credentials") for wrong password', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('throws UnauthorizedException("Invalid credentials") for non-existent email', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('returns same generic message for wrong password and non-existent email', async () => {
      // Wrong password case
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);
      let msgWrongPwd = '';
      try {
        await service.login(loginDto);
      } catch (e: any) {
        msgWrongPwd = e.message;
      }

      // Non-existent email case
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      let msgUnknownEmail = '';
      try {
        await service.login(loginDto);
      } catch (e: any) {
        msgUnknownEmail = e.message;
      }

      expect(msgWrongPwd).toBe(msgUnknownEmail);
      expect(msgWrongPwd).toBe('Invalid credentials');
    });
  });
});
