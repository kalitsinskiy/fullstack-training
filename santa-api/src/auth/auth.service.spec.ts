import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcrypt');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should hash the password, create user, and return id/email/displayName/accessToken', async () => {
      const user = {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'alice@test.com',
        displayName: 'Alice',
        role: 'user',
      };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('$hashed' as never);
      mockUsersService.create.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('signed-token');

      const result = await service.register({
        email: 'alice@test.com',
        password: 'password123',
        displayName: 'Alice',
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        email: 'alice@test.com',
        displayName: 'Alice',
        accessToken: 'signed-token',
      });
    });

    it('should throw ConflictException when email is already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        email: 'alice@test.com',
      });

      await expect(
        service.register({
          email: 'alice@test.com',
          password: 'password123',
          displayName: 'Alice',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return accessToken for valid credentials', async () => {
      const user = {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'alice@test.com',
        role: 'user',
        passwordHash: '$hashed',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('signed-token');

      const result = await service.login({
        email: 'alice@test.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'signed-token' });
    });

    it('should throw UnauthorizedException("Invalid credentials") for wrong password', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'alice@test.com',
        role: 'user',
        passwordHash: '$hashed',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'alice@test.com', password: 'wrong' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should throw UnauthorizedException("Invalid credentials") for unknown email — same message as wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@test.com', password: 'password123' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });
  });
});
