import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RoomsService } from './rooms.service';
import { Room } from './schemas/room.schema';

const userId = new Types.ObjectId().toString();
const roomId = new Types.ObjectId().toString();

const mockRoomModel = {
  create: jest.fn(),
  exists: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
};

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getModelToken(Room.name), useValue: mockRoomModel },
      ],
    }).compile();
    service = module.get<RoomsService>(RoomsService);
  });

  describe('create', () => {
    it('should call model.create with a 6-char invite code, creatorId, and creator in participants', async () => {
      const created = {
        _id: roomId,
        name: 'Test Room',
        creatorId: userId,
        inviteCode: 'ABC123',
        participants: [userId],
        status: 'pending',
      };
      mockRoomModel.create.mockResolvedValue(created);

      const result = await service.create({ name: 'Test Room' }, userId);

      expect(mockRoomModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Room',
          creatorId: userId,
          participants: [userId],
          inviteCode: expect.stringMatching(/^[A-Z0-9]{6}$/),
        }),
      );
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('should return the room when found', async () => {
      const room = { _id: roomId, name: 'Test Room' };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(room),
      });

      const result = await service.findById(roomId);

      expect(result).toEqual(room);
    });

    it('should return null when room does not exist', async () => {
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findById(roomId);

      expect(result).toBeNull();
    });
  });

  describe('join', () => {
    it('should add user to participants using $addToSet', async () => {
      const room = {
        _id: roomId,
        inviteCode: 'ABC123',
        status: 'pending',
        participants: [],
      };
      const updated = { ...room, participants: [userId] };
      mockRoomModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(room),
      });
      mockRoomModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.join('ABC123', userId);

      expect(mockRoomModel.findOneAndUpdate).toHaveBeenCalledWith(
        { inviteCode: 'ABC123' },
        { $addToSet: { participants: userId } },
        { new: true },
      );
      expect(result).toEqual(updated);
    });

    it('should be a no-op for duplicate joins ($addToSet handles idempotency)', async () => {
      const room = {
        _id: roomId,
        inviteCode: 'ABC123',
        status: 'pending',
        participants: [userId],
      };
      mockRoomModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(room),
      });
      mockRoomModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(room),
      });

      const result = await service.join('ABC123', userId);

      expect(result.participants).toContain(userId);
    });

    it('should throw ForbiddenException when room status is drawn', async () => {
      const room = {
        _id: roomId,
        inviteCode: 'ABC123',
        status: 'drawn',
        participants: [userId],
      };
      mockRoomModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(room),
      });

      await expect(service.join('ABC123', userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRoomModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('draw', () => {
    it('should throw ForbiddenException when caller is not the room owner', async () => {
      const room = {
        _id: roomId,
        creatorId: { toString: () => 'someone-else' },
        participants: [
          { toString: () => 'u1' },
          { toString: () => 'u2' },
          { toString: () => 'u3' },
        ],
        status: 'pending',
      };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(room),
      });

      await expect(service.draw(roomId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRoomModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when fewer than 3 participants', async () => {
      const room = {
        _id: roomId,
        creatorId: { toString: () => userId },
        participants: [{ toString: () => 'u1' }, { toString: () => 'u2' }],
        status: 'pending',
      };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(room),
      });

      await expect(service.draw(roomId, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRoomModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should assign each participant a unique receiver and flip status to drawn', async () => {
      const ids = ['id1', 'id2', 'id3'].map((id) => ({ toString: () => id }));
      const room = {
        _id: roomId,
        creatorId: { toString: () => userId },
        participants: ids,
        status: 'pending',
      };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(room),
      });
      mockRoomModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...room, status: 'drawn' }),
      });

      await service.draw(roomId, userId);

      const updateArg = mockRoomModel.findByIdAndUpdate.mock.calls[0][1] as {
        status: string;
        assignments: Map<string, string>;
      };
      expect(updateArg.status).toBe('drawn');

      const { assignments } = updateArg;
      expect(assignments.size).toBe(3);

      const givers = [...assignments.keys()];
      const receivers = [...assignments.values()];

      expect(givers.sort()).toEqual(['id1', 'id2', 'id3'].sort());
      expect(new Set(receivers).size).toBe(3);
      givers.forEach((giver) => expect(assignments.get(giver)).not.toBe(giver));
    });
  });
});
