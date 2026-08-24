import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { InternalController } from './internal.controller';
import { ServiceKeyGuard } from './guards/service-key.guard';
import { UsersService } from '../users/users.service';
import { Room } from '../rooms/schemas/room.schema';

const mockUsersService = {
  findById: jest.fn(),
};

const roomId = new Types.ObjectId();
const userId1 = new Types.ObjectId();
const userId2 = new Types.ObjectId();

const mockRoomDoc = {
  _id: roomId,
  name: 'Test Room',
  participants: [
    { userId: userId1, role: 'owner' },
    { userId: userId2, role: 'member' },
  ],
};

const mockRoomModel = {
  findById: jest.fn(),
};

describe('InternalController', () => {
  let controller: InternalController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: getModelToken(Room.name), useValue: mockRoomModel },
      ],
    })
      .overrideGuard(ServiceKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InternalController>(InternalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUser', () => {
    const user = {
      id: userId1.toString(),
      displayName: 'Alice',
      email: 'alice@test.com',
      role: 'user' as const,
    };

    it('returns id, displayName and email for a valid user', async () => {
      mockUsersService.findById.mockResolvedValue(user);

      const result = await controller.getUser(userId1.toString());

      expect(mockUsersService.findById).toHaveBeenCalledWith(
        userId1.toString(),
      );
      expect(result).toEqual({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
      });
    });

    it('propagates NotFoundException when user does not exist', async () => {
      mockUsersService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.getUser(new Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRoom', () => {
    it('returns id, name and memberIds for a valid room', async () => {
      mockRoomModel.findById.mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(mockRoomDoc) }),
      });

      const result = await controller.getRoom(roomId.toString());

      expect(mockRoomModel.findById).toHaveBeenCalledWith(roomId.toString());
      expect(result).toEqual({
        id: roomId.toString(),
        name: 'Test Room',
        memberIds: [userId1.toString(), userId2.toString()],
      });
    });

    it('throws NotFoundException for a non-existent room', async () => {
      mockRoomModel.findById.mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      });

      await expect(
        controller.getRoom(new Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for an invalid ObjectId', async () => {
      await expect(controller.getRoom('not-an-objectid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
