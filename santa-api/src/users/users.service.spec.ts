import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a user and returns the User shape', async () => {
      const input = {
        email: 'Alice@Test.com',
        displayName: 'Alice',
        passwordHash: 'hashed',
      };
      mockUserModel.create.mockResolvedValue({
        id: 'user-id',
        email: 'alice@test.com',
        displayName: 'Alice',
        role: 'user',
      });

      const result = await service.create(input);

      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: 'alice@test.com',
        displayName: 'Alice',
        passwordHash: 'hashed',
        role: 'user',
      });
      expect(result).toEqual({
        id: 'user-id',
        email: 'alice@test.com',
        displayName: 'Alice',
        role: 'user',
      });
    });

    it('defaults role to user when not specified', async () => {
      mockUserModel.create.mockResolvedValue({
        id: 'id',
        email: 'a@b.com',
        displayName: 'A',
        role: 'user',
      });

      await service.create({
        email: 'a@b.com',
        displayName: 'A',
        passwordHash: 'h',
      });

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user' }),
      );
    });
  });

  describe('findByEmail', () => {
    it('finds a user by lowercase email', async () => {
      const doc = {
        id: 'user-id',
        email: 'alice@test.com',
        passwordHash: 'hash',
      };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(doc),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findByEmail('Alice@Test.com', {
        withPassword: true,
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: { $eq: 'alice@test.com' },
      });
      expect(mockQuery.select).toHaveBeenCalledWith('+passwordHash');
      expect(result).toEqual(doc);
    });

    it('returns null when user not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findByEmail('unknown@test.com');

      expect(result).toBeNull();
    });

    it('does not select passwordHash by default', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      mockUserModel.findOne.mockReturnValue(mockQuery);

      await service.findByEmail('a@b.com');

      expect(mockQuery.select).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns the User shape for a valid id', async () => {
      const doc = {
        id: '64e000000000000000000001',
        email: 'a@b.com',
        displayName: 'A',
        role: 'user',
      };
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      const result = await service.findById('64e000000000000000000001');

      expect(result).toEqual({
        id: '64e000000000000000000001',
        email: 'a@b.com',
        displayName: 'A',
        role: 'user',
      });
    });

    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(service.findById('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findById('64e000000000000000000001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCurrentUser', () => {
    it('updates displayName and returns the updated User', async () => {
      const doc = {
        id: '64e000000000000000000001',
        email: 'a@b.com',
        displayName: 'New Name',
        role: 'user',
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      const result = await service.updateCurrentUser(
        '64e000000000000000000001',
        { displayName: 'New Name' },
      );

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId('64e000000000000000000001'),
        { displayName: 'New Name' },
        { new: true },
      );
      expect(result).toEqual({
        id: '64e000000000000000000001',
        email: 'a@b.com',
        displayName: 'New Name',
        role: 'user',
      });
    });

    it('throws NotFoundException for invalid id', async () => {
      await expect(
        service.updateCurrentUser('bad-id', { displayName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateCurrentUser('64e000000000000000000001', {
          displayName: 'X',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
