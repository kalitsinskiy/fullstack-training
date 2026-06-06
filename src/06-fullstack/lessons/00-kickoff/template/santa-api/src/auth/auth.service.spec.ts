import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'create' | 'findByEmail'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('register hashes the password and returns an access token', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue('$hash' as never);
    usersService.create.mockResolvedValue({
      id: 'user-1',
      email: 'alice@test.com',
      displayName: 'Alice',
      role: 'user',
    });
    jwtService.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.register({
        email: 'ALICE@TEST.COM',
        password: 'SecretPass1',
        displayName: 'Alice',
      }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'alice@test.com',
      displayName: 'Alice',
      accessToken: 'signed-token',
    });

    expect(usersService.findByEmail).toHaveBeenCalledWith('alice@test.com');
    expect(mockBcrypt.hash).toHaveBeenCalledWith('SecretPass1', 10);
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'alice@test.com',
      displayName: 'Alice',
      passwordHash: '$hash',
      role: 'user',
    });
  });

  it('register rejects duplicate emails', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'existing-user',
    } as never);

    await expect(
      service.register({
        email: 'alice@test.com',
        password: 'SecretPass1',
        displayName: 'Alice',
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockBcrypt.hash).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('login returns a token for valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue({
      _id: { toString: () => 'user-1' },
      email: 'alice@test.com',
      role: 'user',
      passwordHash: '$hash',
    } as never);
    mockBcrypt.compare.mockResolvedValue(true as never);
    jwtService.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.login({ email: 'ALICE@TEST.COM', password: 'SecretPass1' }),
    ).resolves.toEqual({ accessToken: 'signed-token' });

    expect(usersService.findByEmail).toHaveBeenCalledWith('alice@test.com', {
      withPassword: true,
    });
    expect(mockBcrypt.compare).toHaveBeenCalledWith('SecretPass1', '$hash');
  });

  it.each([
    {
      name: 'missing user',
      foundUser: null,
      compareResult: undefined,
    },
    {
      name: 'wrong password',
      foundUser: {
        _id: { toString: () => 'user-1' },
        email: 'alice@test.com',
        role: 'user',
        passwordHash: '$hash',
      },
      compareResult: false,
    },
  ])(
    'login rejects $name with the same generic message',
    async ({ foundUser, compareResult }) => {
      usersService.findByEmail.mockResolvedValue(foundUser as never);

      if (typeof compareResult === 'boolean') {
        mockBcrypt.compare.mockResolvedValue(compareResult as never);
      }

      await expect(
        service.login({ email: 'alice@test.com', password: 'SecretPass1' }),
      ).rejects.toMatchObject({
        message: 'Invalid credentials',
      });
    },
  );
});
