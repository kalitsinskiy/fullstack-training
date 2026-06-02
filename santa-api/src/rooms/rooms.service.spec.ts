import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RoomsService } from './rooms.service';
import { Room } from './schemas/room.schema';

const makeExec = (resolvedValue: any) => ({
  exec: jest.fn().mockResolvedValue(resolvedValue),
});

describe('RoomsService', () => {
  let service: RoomsService;

  const mockRoomModel = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getModelToken(Room.name),
          useValue: mockRoomModel,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('generates a 6-char invite code, sets creatorId, includes creator in participants, status pending', async () => {
      const ownerId = new Types.ObjectId().toString();
      const returnedRoom = {
        name: 'Test Room',
        creatorId: ownerId,
        inviteCode: 'ABC123',
        participants: [ownerId],
        status: 'pending',
      };
      mockRoomModel.create.mockResolvedValue(returnedRoom);

      const result = await service.create({ name: 'Test Room', ownerId });

      const callArg = mockRoomModel.create.mock.calls[0][0];
      expect(callArg.creatorId).toBe(ownerId);
      expect(callArg.participants).toContain(ownerId);
      expect(callArg.inviteCode).toMatch(/^[A-Z0-9]{1,6}$/);
      expect(result.status).toBe('pending');
    });
  });

  describe('findById()', () => {
    it('returns the room when found', async () => {
      const mockRoom = { _id: new Types.ObjectId(), name: 'Test' };
      mockRoomModel.findById.mockReturnValue(makeExec(mockRoom));

      const result = await service.findById(mockRoom._id.toString());
      expect(result).toBe(mockRoom);
    });

    it('throws NotFoundException when room not found', async () => {
      mockRoomModel.findById.mockReturnValue(makeExec(null));

      await expect(
        service.findById('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('join()', () => {
    const roomId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('adds user to participants using $addToSet', async () => {
      const mockRoom = { _id: roomId, status: 'pending', participants: [] };
      mockRoomModel.findById.mockReturnValue(makeExec(mockRoom));
      const updatedRoom = { ...mockRoom, participants: [userId] };
      mockRoomModel.findByIdAndUpdate.mockReturnValue(makeExec(updatedRoom));

      const result = await service.join(roomId, userId);

      expect(mockRoomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        roomId,
        { $addToSet: { participants: userId } },
        { new: true },
      );
      expect(result).toBe(updatedRoom);
    });

    it('duplicate join is a no-op (handled by $addToSet)', async () => {
      const mockRoom = {
        _id: roomId,
        status: 'pending',
        participants: [userId],
      };
      mockRoomModel.findById.mockReturnValue(makeExec(mockRoom));
      mockRoomModel.findByIdAndUpdate.mockReturnValue(makeExec(mockRoom));

      const result = await service.join(roomId, userId);
      expect(result.participants).toContain(userId);
    });

    it('throws ForbiddenException if room status is drawn', async () => {
      const mockRoom = { _id: roomId, status: 'drawn', participants: [] };
      mockRoomModel.findById.mockReturnValue(makeExec(mockRoom));

      await expect(service.join(roomId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('draw()', () => {
    const roomId = new Types.ObjectId().toString();

    it('throws BadRequestException if participants.length < 3', async () => {
      const mockRoom = {
        _id: roomId,
        participants: [new Types.ObjectId(), new Types.ObjectId()],
        status: 'pending',
      };
      mockRoomModel.findById.mockReturnValue(makeExec(mockRoom));

      await expect(service.draw(roomId)).rejects.toThrow(BadRequestException);
    });

    it('flips status to drawn when participants >= 3', async () => {
      const ids = [
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
      ];
      const mockRoom = { _id: roomId, participants: ids, status: 'pending' };
      mockRoomModel.findById.mockReturnValue(makeExec(mockRoom));
      const drawnRoom = { ...mockRoom, status: 'drawn' };
      mockRoomModel.findByIdAndUpdate.mockReturnValue(makeExec(drawnRoom));

      const result = await service.draw(roomId);

      expect(mockRoomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        roomId,
        expect.objectContaining({ status: 'drawn' }),
        { new: true },
      );
      expect(result.status).toBe('drawn');
    });
  });
});
