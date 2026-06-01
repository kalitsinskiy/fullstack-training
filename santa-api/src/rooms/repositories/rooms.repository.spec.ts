import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomsRepository } from './rooms.repository';
import { RoomResponseDto } from '../dto/room-response.dto';
import { Types } from 'mongoose';

describe('RoomsRepository', () => {
  let repository: RoomsRepository;
  const roomModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsRepository,
        {
          provide: getModelToken('Room'),
          useValue: roomModel,
        },
      ],
    }).compile();

    repository = module.get<RoomsRepository>(RoomsRepository);
  });

  it('creates a room with a unique invite code and creator participant', async () => {
    const ownerId = new Types.ObjectId().toString();
    const createdAt = new Date();
    const roomData = {
      _id: new Types.ObjectId().toString(),
      name: 'Secret Santa',
      creatorId: ownerId,
      inviteCode: 'ABC123',
      participants: [ownerId],
      status: 'pending' as const,
      createdAt,
      updatedAt: createdAt,
    };

    roomModel.create.mockResolvedValue(roomData);

    const result = await repository.create({
      name: 'Secret Santa',
      ownerId,
    });

    expect(roomModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Secret Santa',
        creatorId: ownerId,
        inviteCode: expect.any(String),
        participants: [ownerId],
      }),
    );
    expect(result).toBeInstanceOf(RoomResponseDto);
    expect(result.creatorId).toBe(ownerId);
    expect(result.participants).toEqual([ownerId]);
  });

  it('returns paginated results from findAll', async () => {
    const roomA = {
      _id: new Types.ObjectId().toString(),
      name: 'A',
      creatorId: new Types.ObjectId().toString(),
      inviteCode: 'ABC123',
      participants: [new Types.ObjectId().toString()],
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const queryChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([roomA]),
    };
    roomModel.find.mockReturnValue(queryChain as any);
    roomModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    } as any);

    const result = await repository.findAll(1, 10);

    expect(roomModel.find).toHaveBeenCalledWith({});
    expect(result.meta).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(result.data[0]).toBeInstanceOf(RoomResponseDto);
  });

  it('finds a room by id', async () => {
    const roomA = {
      _id: new Types.ObjectId().toString(),
      name: 'A',
      creatorId: new Types.ObjectId().toString(),
      inviteCode: 'ABC123',
      participants: [new Types.ObjectId().toString()],
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    roomModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(roomA),
    } as any);

    const result = await repository.findById(roomA._id);

    expect(roomModel.findById).toHaveBeenCalledWith(roomA._id);
    expect(result).toBeInstanceOf(RoomResponseDto);
    expect(result?.id).toBe(roomA._id);
  });

  it('returns null when findById has no result', async () => {
    roomModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    const result = await repository.findById('missing-id');

    expect(result).toBeNull();
  });

  it('finds a room by invite code', async () => {
    const roomA = {
      _id: new Types.ObjectId().toString(),
      name: 'A',
      creatorId: new Types.ObjectId().toString(),
      inviteCode: 'ABC123',
      participants: [new Types.ObjectId().toString()],
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    roomModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(roomA),
    } as any);

    const result = await repository.findByCode('ABC123');

    expect(roomModel.findOne).toHaveBeenCalledWith({ inviteCode: 'ABC123' });
    expect(result).toBeInstanceOf(RoomResponseDto);
    expect(result?.inviteCode).toBe('ABC123');
  });

  it('adds a member with $addToSet and returns the updated room', async () => {
    const roomA = {
      _id: new Types.ObjectId().toString(),
      name: 'A',
      creatorId: new Types.ObjectId().toString(),
      inviteCode: 'ABC123',
      participants: [new Types.ObjectId().toString(), 'new-user'],
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    roomModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(roomA),
    } as any);

    const result = await repository.addMember('ABC123', {
      userId: 'new-user',
    });

    expect(roomModel.findOneAndUpdate).toHaveBeenCalledWith(
      { inviteCode: 'ABC123' },
      { $addToSet: { participants: 'new-user' } },
      { new: true },
    );
    expect(result).toBeInstanceOf(RoomResponseDto);
  });

  it('updates a room by id and returns the updated document', async () => {
    const roomA = {
      _id: new Types.ObjectId().toString(),
      name: 'Updated Room',
      creatorId: new Types.ObjectId().toString(),
      inviteCode: 'ABC123',
      participants: [new Types.ObjectId().toString()],
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    roomModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(roomA),
    } as any);

    const result = await repository.updateById(roomA._id, {
      name: 'Updated Room',
    });

    expect(roomModel.findByIdAndUpdate).toHaveBeenCalledWith(
      roomA._id,
      { name: 'Updated Room' },
      { new: true },
    );
    expect(result).toBeInstanceOf(RoomResponseDto);
    expect(result?.name).toBe('Updated Room');
  });

  it('deletes a room by id and returns true when found', async () => {
    roomModel.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    } as any);

    const result = await repository.deleteById('room-id');

    expect(roomModel.findByIdAndDelete).toHaveBeenCalledWith('room-id');
    expect(result).toBe(true);
  });

  it('returns false when deleteById does not find a room', async () => {
    roomModel.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    const result = await repository.deleteById('missing-id');

    expect(result).toBe(false);
  });
});
