import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Reflector } from '@nestjs/core';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { RoomPermissionsGuard } from '../rooms/guards/room-permissions.guard';
import { Room } from '../rooms/schemas/room.schema';

describe('WishlistController', () => {
  let controller: WishlistController;
  const mockWishlistService = {
    set: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
      providers: [
        { provide: WishlistService, useValue: mockWishlistService },
        { provide: getModelToken(Room.name), useValue: {} },
        RoomPermissionsGuard,
        Reflector,
      ],
    }).compile();

    controller = module.get<WishlistController>(WishlistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('set', () => {
    it('delegates to wishlistService.set with roomId, userId, items', async () => {
      const wishlist = { roomId: 'room-id', userId: 'user-id', items: ['Socks', 'Book'] };
      mockWishlistService.set.mockResolvedValue(wishlist);

      const result = await controller.set('room-id', 'user-id', { items: ['Socks', 'Book'] });

      expect(mockWishlistService.set).toHaveBeenCalledWith('room-id', 'user-id', ['Socks', 'Book']);
      expect(result).toEqual(wishlist);
    });
  });

  describe('findOne', () => {
    it('delegates to wishlistService.get with roomId and userId', async () => {
      const wishlist = { roomId: 'room-id', userId: 'target-user', items: ['Tea'] };
      mockWishlistService.get.mockResolvedValue(wishlist);

      const result = await controller.findOne('room-id', 'target-user');

      expect(mockWishlistService.get).toHaveBeenCalledWith('room-id', 'target-user');
      expect(result).toEqual(wishlist);
    });

    it('returns an empty wishlist when user has none', async () => {
      const emptyWishlist = { roomId: 'room-id', userId: 'user-id', items: [] };
      mockWishlistService.get.mockResolvedValue(emptyWishlist);

      const result = await controller.findOne('room-id', 'user-id');

      expect(result.items).toEqual([]);
    });
  });
});
