import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockService = {
  findById: jest.fn<() => Promise<any>>(),
  updateById: jest.fn<() => Promise<any>>(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('getMe', () => {
    it('should return the current user by id', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'alice@example.com',
      };
      mockService.findById.mockResolvedValue(mockUser);

      const result = await controller.getMe('507f1f77bcf86cd799439011');

      expect(mockService.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateMe', () => {
    it('should update and return the current user', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        displayName: 'Alice Updated',
      };
      mockService.updateById.mockResolvedValue(mockUser);

      const result = await controller.updateMe('507f1f77bcf86cd799439011', {
        displayName: 'Alice Updated',
      });

      expect(mockService.updateById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { displayName: 'Alice Updated' },
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'alice@example.com',
      };
      mockService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException for unknown id', async () => {
      mockService.findById.mockResolvedValue(null);

      await expect(
        controller.findOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
