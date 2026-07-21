import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RoomsService } from './rooms.service';
import { Room } from './schemas/room.schema';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { RedisService } from '../common/redis/redis.service';
import { EventPublisherService } from '../events/eventPublisher.service';

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

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const mockEventPublisher = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRedisService.get.mockResolvedValue(null);
    mockRedisService.set.mockResolvedValue(undefined);
    mockRedisService.del.mockResolvedValue(undefined);

    mockUsersService.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        displayName: `User-${id.slice(-4)}`,
        email: `${id}@test.com`,
        role: 'user',
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getModelToken(Room.name), useValue: mockRoomModel },
        { provide: UsersService, useValue: mockUsersService },
        { provide: WishlistService, useValue: mockWishlistService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: EventPublisherService, useValue: mockEventPublisher },
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

      const result = await service.create(dto, creatorId);

      expect(mockRoomModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Holiday Party',
          creatorId: new Types.ObjectId(creatorId),
          participants: [
            { userId: new Types.ObjectId(creatorId), role: 'owner' },
          ],
          status: 'pending',
        }),
      );
      expect(result.name).toBe('Holiday Party');
      expect(result.status).toBe('pending');
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].role).toBe('owner');
      expect(result.inviteCode).toBeDefined();
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'room.created',
        expect.objectContaining({ roomName: 'Holiday Party' }),
      );
    });

    it('includes budget and currency when provided', async () => {
      const dto = { name: 'Office Party', budget: 500, currency: '₴' };
      mockRoomModel.create.mockImplementation(async (data: any) => ({
        id: 'room-id',
        ...data,
        participants: data.participants,
      }));

      const result = await service.create(dto, creatorId);

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
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
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

      const result = await service.findByUser(creatorId, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
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
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
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
      await expect(
        service.findByIdForUser('invalid', creatorId),
      ).rejects.toThrow(NotFoundException);
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
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
        status: 'pending',
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
      };
    }

    it('adds the user as a member with the correct invite code', async () => {
      const doc = makeRoomDoc();
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      const result = await service.join(roomId, 'JOIN01', memberId);

      expect(doc.participants).toHaveLength(2);
      expect(doc.participants[1]).toEqual({
        userId: new Types.ObjectId(memberId),
        role: 'member',
      });
      expect(doc.save).toHaveBeenCalled();
      expect(result.participantCount).toBe(2);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'user.joined',
        expect.objectContaining({ roomId, userId: memberId }),
      );
    });

    it('does not duplicate if user is already a member', async () => {
      const doc = makeRoomDoc({
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
          { userId: new Types.ObjectId(memberId), role: 'member' },
        ],
      });
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      await service.join(roomId, 'JOIN01', memberId);

      expect(doc.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for wrong invite code', async () => {
      const doc = makeRoomDoc();
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      await expect(service.join(roomId, 'WRONG', memberId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if room is already drawn', async () => {
      const doc = makeRoomDoc({ status: 'drawn' });
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      await expect(service.join(roomId, 'JOIN01', memberId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException for non-existent room', async () => {
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.join(roomId, 'JOIN01', memberId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('joinByCode', () => {
    it('throws BadRequestException when invite code is not in Redis', async () => {
      mockRedisService.get.mockResolvedValue(null);
      await expect(service.joinByCode('NOROOM', creatorId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('joins the room when invite code resolves to a valid roomId', async () => {
      const roomId = new Types.ObjectId().toString();
      const doc = {
        id: roomId,
        name: 'Party',
        creatorId: new Types.ObjectId(creatorId),
        inviteCode: 'JOIN42',
        participants: [{ userId: new Types.ObjectId(creatorId), role: 'owner' }],
        status: 'pending',
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockRedisService.get.mockResolvedValue(roomId);
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      const result = await service.joinByCode('JOIN42', memberId);

      expect(doc.save).toHaveBeenCalled();
      expect(result.participantCount).toBe(2);
    });
  });

  describe('draw', () => {
    const roomId = new Types.ObjectId().toString();

    function makeDrawableRoom(overrides: Partial<any> = {}) {
      const p3 = new Types.ObjectId().toString();
      return {
        id: roomId,
        name: 'Party',
        creatorId: new Types.ObjectId(creatorId),
        inviteCode: 'DRW001',
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
          { userId: new Types.ObjectId(memberId), role: 'member' },
          { userId: new Types.ObjectId(p3), role: 'member' },
        ],
        status: 'pending',
        assignments: [],
        ...overrides,
      };
    }

    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(
        service.draw('invalid-id', creatorId, '2026-12-24'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when room is already drawn', async () => {
      const doc = makeDrawableRoom({ status: 'drawn' });
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      await expect(
        service.draw(roomId, creatorId, '2026-12-24'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when fewer than 3 participants', async () => {
      const doc = makeDrawableRoom({
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
          { userId: new Types.ObjectId(memberId), role: 'member' },
        ],
      });
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      await expect(
        service.draw(roomId, creatorId, '2026-12-24'),
      ).rejects.toThrow(BadRequestException);
    });

    it('runs the draw and returns the updated room', async () => {
      const doc = makeDrawableRoom();
      const updatedDoc = {
        ...doc,
        status: 'drawn',
        drawDate: new Date(),
        exchangeDate: new Date('2026-12-24'),
        assignments: doc.participants.map((p: any, i: number) => ({
          giverId: p.userId,
          receiverId:
            doc.participants[(i + 1) % doc.participants.length].userId,
        })),
      };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      mockRoomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedDoc),
      });

      const result = await service.draw(roomId, creatorId, '2026-12-24');

      expect(mockRoomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        roomId,
        expect.objectContaining({ status: 'drawn' }),
        { new: true },
      );
      expect(result.status).toBe('drawn');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'draw.completed',
        expect.objectContaining({ roomId, participantCount: 3 }),
      );
    });
  });

  describe('getAssignment', () => {
    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(
        service.getAssignment('invalid-id', creatorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when draw not performed', async () => {
      const roomId = new Types.ObjectId().toString();
      const doc = {
        id: roomId,
        status: 'pending',
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
        assignments: [],
      };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      await expect(service.getAssignment(roomId, creatorId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('editRoom', () => {
    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(
        service.editRoom('invalid-id', {} as any, creatorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates only the provided fields', async () => {
      const roomId = new Types.ObjectId().toString();
      const doc = {
        id: roomId,
        creatorId: new Types.ObjectId(creatorId),
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
        status: 'pending',
      };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      mockRoomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...doc, name: 'Renamed' }),
      });

      const result = await service.editRoom(
        roomId,
        { name: 'Renamed' },
        creatorId,
      );

      expect(mockRoomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        roomId,
        { name: 'Renamed' },
        { new: true },
      );
      expect(result.name).toBe('Renamed');
    });
  });

  describe('deleteRoom', () => {
    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(service.deleteRoom('invalid-id', creatorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the room by id', async () => {
      const roomId = new Types.ObjectId().toString();
      const doc = { id: roomId, creatorId: new Types.ObjectId(creatorId) };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      mockRoomModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });

      await service.deleteRoom(roomId, creatorId);

      expect(mockRoomModel.findByIdAndDelete).toHaveBeenCalledWith(roomId);
    });
  });

  describe('kickMember', () => {
    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(
        service.kickMember('invalid-id', memberId, creatorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when trying to kick the owner', async () => {
      const roomId = new Types.ObjectId().toString();
      const doc = {
        id: roomId,
        creatorId: new Types.ObjectId(creatorId),
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
        save: jest.fn(),
      };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      await expect(
        service.kickMember(roomId, creatorId, creatorId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('regenerateInviteCode', () => {
    it('throws NotFoundException for invalid ObjectId', async () => {
      await expect(
        service.regenerateInviteCode('invalid-id', creatorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('replaces the invite code with a fresh one', async () => {
      const roomId = new Types.ObjectId().toString();
      const doc = {
        id: roomId,
        creatorId: new Types.ObjectId(creatorId),
        inviteCode: 'OLD001',
        participants: [
          { userId: new Types.ObjectId(creatorId), role: 'owner' },
        ],
      };
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
      mockRoomModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...doc, inviteCode: 'NEW002' }),
      });

      const result = await service.regenerateInviteCode(roomId, creatorId);

      expect(mockRoomModel.findByIdAndUpdate).toHaveBeenCalledWith(
        roomId,
        expect.objectContaining({ inviteCode: expect.any(String) }),
        { new: true },
      );
      expect(result.inviteCode).toBe('NEW002');
    });
  });
});
