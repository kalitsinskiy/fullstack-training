import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };
  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = {
      email: 'alice@test.com',
      password: 'supersecret123',
      displayName: 'Alice',
    };

    it('registers a user and returns id, email, displayName, accessToken', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('$2b$10$hashedpassword' as never);
      mockUsersService.create.mockResolvedValue({
        id: 'user-id',
        email: dto.email,
        displayName: dto.displayName,
        role: 'user',
      });

      const result = await service.register(dto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: dto.email,
        displayName: dto.displayName,
        passwordHash: '$2b$10$hashedpassword',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        email: dto.email,
        role: 'user',
      });
      expect(result).toEqual({
        id: 'user-id',
        email: dto.email,
        displayName: dto.displayName,
        accessToken: 'mock-token',
      });
    });

    it('throws ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-id' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);

      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'alice@test.com', password: 'supersecret123' };

    it('returns an accessToken for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: dto.email,
        role: 'user',
        passwordHash: '$2b$10$hashedpassword',
      });
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login(dto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email, {
        withPassword: true,
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        '$2b$10$hashedpassword',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        email: dto.email,
        role: 'user',
      });
      expect(result).toEqual({ accessToken: 'mock-token' });
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: dto.email,
        role: 'user',
        passwordHash: '$2b$10$hashedpassword',
      });
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('throws UnauthorizedException for unknown email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('throws UnauthorizedException when user has no passwordHash', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: dto.email,
        role: 'user',
        passwordHash: undefined,
      });

      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });
});
