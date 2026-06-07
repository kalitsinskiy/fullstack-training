import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

const mockService = {
  set: jest.fn<() => Promise<any>>(),
  get: jest.fn<() => Promise<any>>(),
};

describe('WishlistController', () => {
  let controller: WishlistController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
      providers: [{ provide: WishlistService, useValue: mockService }],
    }).compile();

    controller = module.get<WishlistController>(WishlistController);
  });

  describe('set', () => {
    it('should store and return the wishlist', async () => {
      const mockWishlist = {
        roomId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        items: [{ name: 'toy car' }, { name: 'book' }],
      };
      mockService.set.mockResolvedValue(mockWishlist);

      const result = await controller.set(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        { items: [{ name: 'toy car' }, { name: 'book' }] },
      );

      expect(result).toEqual(mockWishlist);
    });
  });

  describe('get', () => {
    it('should return the wishlist for an existing entry', async () => {
      const mockWishlist = {
        roomId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        items: [{ name: 'toy car' }, { name: 'book' }],
      };
      mockService.get.mockResolvedValue(mockWishlist);

      const result = await controller.get(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );

      expect(result).toEqual(mockWishlist);
    });

    it('should throw NotFoundException for an unknown roomId/userId combination', async () => {
      mockService.get.mockResolvedValue(null);

      await expect(
        controller.get('507f1f77bcf86cd799439011', 'non-existent-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
