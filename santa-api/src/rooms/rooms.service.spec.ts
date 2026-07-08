import {
  BadRequestException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RoomsService } from './rooms.service';
import { Room } from './schemas/room.schema';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';

describe('RoomsService', () => {
  let service: RoomsService;

  const creatorId = new Types.ObjectId().toString();
  const memberId = new Types.ObjectId().toString();

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockWishlistService = {
    get: jest.fn(),
  };

  const mockRoomModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUsersService.findById.mockImplementation((id: string) =>
      Promise.resolve({ id, displayName: `User-${id.slice(-4)}`, email: `${id}@test.com`, role: 'user' }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getModelToken(Room.name), useValue: mockRoomModel },
        { provide: UsersService, useValue: mockUsersService },
        { provide: WishlistService, useValue: mockWishlistService },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a room with the creator as owner', async () => {
      const dto = { name: 'Holiday Party' };
      mockRoomModel.create.mockImplementation(async (data: any) => ({
        id: 'room-id',
        ...data,
        status: 'pending',
        participants: data.participants,
        toJSON: () => data,
      }));

      const result = await service.create(dto as any, creatorId);

      expect(mockRoomModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Holiday Party',
          creatorId: new Types.ObjectId(creatorId),
          participants: [{ userId: new Types.ObjectId(creatorId), role: 'owner' }],
          status: 'pending',
        }),
      );
      expect(result.name).toBe('Holiday Party');
      expect(result.status).toBe('pending');
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].role).toBe('owner');
      expect(result.inviteCode).toBeDefined();
    });

    it('includes budget and currency when provided', async () => {
      const dto = { name: 'Office Party', budget: 500, currency: '₴' };
      mockRoomModel.create.mockImplementation(async (data: any) => ({
        id: 'room-id',
        ...data,
        participants: data.participants,
      }));

      const result = await service.create(dto as any, creatorId);

      expect(mockRoomModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ budget: 500, currency: '₴' }),
      );
      expect(result.budget).toBe(500);
      expect(result.currency).toBe('₴');
    });
  });

  describe('findByUser', () => {
    it('returns paginated rooms for the user', async () => {
      const roomDoc = {
        id: 'room-id',
        name: 'Test Room',
        creatorId: new Types.ObjectId(creatorId),
        inviteCode: 'ABC123',
        participants: [{ userId: new Types.ObjectId(creatorId), role: 'owner' }],
        status: 'pending',
      };
      mockRoomModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([roomDoc]),
      });
      mockRoomModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findByUser(creatorId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });
  });

  describe('findByIdForUser', () => {
    it('returns the room when user is a participant', async () => {
      const roomId = new Types.ObjectId().toString();
      const roomDoc = {
        id: roomId,
        name: 'Test Room',
        creatorId: new Types.ObjectId(creatorId),
        inviteCode: 'XYZ789',
        participants: [{ userId: new Types.ObjectId(creatorId), role: 'owner' }],
        status: 'pending',
      };
      mockRoomModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(roomDoc),
      });

      const result = await service.findByIdForUser(roomId, creatorId);

      expect(result.name).toBe('Test Room');
      expect(result.viewerPermissions).toContain('room:view');
      expect(result.viewerPermissions).toContain('room:draw');
    });

    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(service.findByIdForUser('invalid', creatorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user is not a participant', async () => {
      mockRoomModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findByIdForUser(new Types.ObjectId().toString(), creatorId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('join', () => {
    const roomId = new Types.ObjectId().toString();

    function makeRoomDoc(overrides: Partial<any> = {}) {
      return {
        id: roomId,
        name: 'Party',
        creatorId: new Types.ObjectId(creatorId),
        inviteCode: 'JOIN01',
        participants: [{ userId: new Types.ObjectId(creatorId), role: 'owner' }],
        status: 'pending',
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
      };
    }

    it('adds the user as a member with the correct invite code', async () => {
      const doc = makeRoomDoc();
      mockRoomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) });

      const result = await service.join(roomId, 'JOIN01', memberId);

      expect(doc.participants).toHaveLength(2);
      expect(doc.participants[1]).toEqual({
        userId: new Types.ObjectId(memberId),
        role: 'member',
      });
      expect(doc.save).toHaveBeenCalled();
      expect(result.participantCount).toBe(2);
    });

    it('does not duplicate if user is already a member', async () => {
      const doc = makeRoomDoc({
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
          { userId: new Types.ObjectId(memberId), role: 'member' },
        ],
      });
      mockRoomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) });

      await service.join(roomId, 'JOIN01', memberId);

      expect(doc.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for wrong invite code', async () => {
      const doc = makeRoomDoc();
      mockRoomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) });

      await expect(service.join(roomId, 'WRONG', memberId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if room is already drawn', async () => {
      const doc = makeRoomDoc({ status: 'drawn' });
      mockRoomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) });

      await expect(service.join(roomId, 'JOIN01', memberId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException for non-existent room', async () => {
      mockRoomModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.join(roomId, 'JOIN01', memberId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('stub methods (later lessons)', () => {
    it('joinByCode throws NotImplementedException', () => {
      expect(() => service.joinByCode('CODE', creatorId)).toThrow(
        NotImplementedException,
      );
    });

    it('draw throws NotImplementedException', () => {
      expect(() => service.draw('id', creatorId, '2026-12-24')).toThrow(
        NotImplementedException,
      );
    });

    it('getAssignment throws NotImplementedException', () => {
      expect(() => service.getAssignment('id', creatorId)).toThrow(
        NotImplementedException,
      );
    });

    it('editRoom throws NotImplementedException', () => {
      expect(() => service.editRoom('id', {} as any, creatorId)).toThrow(
        NotImplementedException,
      );
    });

    it('deleteRoom throws NotImplementedException', () => {
      expect(() => service.deleteRoom('id', creatorId)).toThrow(
        NotImplementedException,
      );
    });

    it('kickMember throws NotImplementedException', () => {
      expect(() => service.kickMember('id', memberId, creatorId)).toThrow(
        NotImplementedException,
      );
    });

    it('regenerateInviteCode throws NotImplementedException', () => {
      expect(() => service.regenerateInviteCode('id', creatorId)).toThrow(
        NotImplementedException,
      );
    });
  });
});
