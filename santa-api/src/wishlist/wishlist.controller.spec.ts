import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Types } from 'mongoose';

describe('WishlistController', () => {
  let controller: WishlistController;
  const mockWishlistService = {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };
  const mockRoomsService = {
    findByCode: jest.fn(),
  };
  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
      providers: [
        {
          provide: WishlistService,
          useValue: mockWishlistService,
        },
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<WishlistController>(WishlistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call WishlistService.set when setting a wishlist', async () => {
    const roomCode = 'ROOM01';
    const roomId = new Types.ObjectId();
    const userId = '64e000000000000000000002';
    const userObjectId = new Types.ObjectId(userId);
    const items = [{ name: 'item1' }, { name: 'item2', priority: 1 }];

    mockRoomsService.findByCode.mockResolvedValue({ id: roomId.toString() });
    mockUserService.findById.mockResolvedValue({ id: userObjectId.toString() });

    await controller.setWishlist(roomCode, { userId, items });

    expect(mockWishlistService.set).toHaveBeenCalledWith(
      roomId,
      userObjectId,
      items,
    );
  });

  it('should throw NotFoundException if room does not exist when setting a wishlist', async () => {
    const roomCode = 'NONEXISTENT';
    const userId = '64e000000000000000000002';
    const items = [{ name: 'item1' }];
    mockRoomsService.findByCode.mockResolvedValue(undefined);

    await expect(
      controller.setWishlist(roomCode, { userId, items }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if user does not exist when setting a wishlist', async () => {
    const roomCode = 'ROOM01';
    const roomId = new Types.ObjectId();
    const userId = '64e000000000000000000002';
    const items = [{ name: 'item1' }];

    mockRoomsService.findByCode.mockResolvedValue({ id: roomId.toString() });
    mockUserService.findById.mockResolvedValue(undefined);

    await expect(
      controller.setWishlist(roomCode, { userId, items }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should call WishlistService.get when getting a wishlist', async () => {
    const roomCode = 'ROOM01';
    const roomId = new Types.ObjectId();
    const userId = '64e000000000000000000002';
    const userObjectId = new Types.ObjectId(userId);
    const wishlist = { userId, roomId, items: [{ name: 'item1' }] };

    mockWishlistService.get.mockResolvedValue(wishlist);
    mockRoomsService.findByCode.mockResolvedValue({ id: roomId.toString() });
    mockUserService.findById.mockResolvedValue({ id: userObjectId.toString() });

    const result = await controller.getWishlist(roomCode, userId);

    expect(mockWishlistService.get).toHaveBeenCalledWith(roomId, userObjectId);
    expect(result).toEqual(wishlist);
  });

  it('should throw NotFoundException if room does not exist when getting a wishlist', async () => {
    const roomCode = 'NONEXISTENT';
    const userId = '64e000000000000000000002';
    mockRoomsService.findByCode.mockResolvedValue(undefined);

    await expect(controller.getWishlist(roomCode, userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if user does not exist when getting a wishlist', async () => {
    const roomCode = 'ROOM01';
    const roomId = new Types.ObjectId();
    const userId = '64e000000000000000000002';

    mockRoomsService.findByCode.mockResolvedValue({ id: roomId.toString() });
    mockUserService.findById.mockResolvedValue(undefined);

    await expect(controller.getWishlist(roomCode, userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should call WishlistService.set when updating a wishlist', async () => {
    const roomCode = 'ROOM01';
    const roomId = new Types.ObjectId();
    const userId = '64e000000000000000000002';
    const userObjectId = new Types.ObjectId(userId);
    const items = [{ name: 'item1', priority: 2 }];
    const updatedWishlist = { roomId, userId: userObjectId, items };

    mockRoomsService.findByCode.mockResolvedValue({ id: roomId.toString() });
    mockUserService.findById.mockResolvedValue({ id: userObjectId.toString() });
    mockWishlistService.set.mockResolvedValue(updatedWishlist);

    await expect(
      controller.updateWishlist(roomCode, userId, { items }),
    ).resolves.toEqual(updatedWishlist);
    expect(mockWishlistService.set).toHaveBeenCalledWith(
      roomId,
      userObjectId,
      items,
    );
  });

  it('should call WishlistService.delete when deleting a wishlist', async () => {
    const roomCode = 'ROOM01';
    const roomId = new Types.ObjectId();
    const userId = '64e000000000000000000002';
    const userObjectId = new Types.ObjectId(userId);

    mockRoomsService.findByCode.mockResolvedValue({ id: roomId.toString() });
    mockUserService.findById.mockResolvedValue({ id: userObjectId.toString() });
    mockWishlistService.delete.mockResolvedValue(true);

    await expect(controller.removeWishlist(roomCode, userId)).resolves.toEqual({
      success: true,
    });
    expect(mockWishlistService.delete).toHaveBeenCalledWith(
      roomId,
      userObjectId,
    );
  });
});
