import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { EventPublisherService } from '../events/event-publisher.service';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { Room } from './schemas/room.schema';
import { RoomsService } from './rooms.service';

type QueryMock<T> = {
  exec: jest.Mock<Promise<T>, []>;
  select?: jest.Mock<QueryMock<T>, [string]>;
  lean?: jest.Mock<QueryMock<T>, []>;
};

function createQueryMock<T>(value: T): QueryMock<T> {
  const query: QueryMock<T> = {
    exec: jest.fn<Promise<T>, []>().mockResolvedValue(value),
  };

  query.select = jest.fn().mockReturnValue(query);
  query.lean = jest.fn().mockReturnValue(query);

  return query;
}

interface RoomDocumentStub {
  _id: Types.ObjectId;
  name: string;
  creatorId: Types.ObjectId;
  inviteCode: string;
  participants: Types.ObjectId[];
  status: string;
  drawDate?: Date;
  assignments: Array<{ giverId: Types.ObjectId; receiverId: Types.ObjectId }>;
}

function createRoomDocument(
  overrides: Partial<RoomDocumentStub> = {},
): RoomDocumentStub {
  const creatorId = overrides.creatorId ?? new Types.ObjectId();
  const participants = overrides.participants ?? [creatorId];

  return {
    _id: overrides._id ?? new Types.ObjectId(),
    name: overrides.name ?? 'North Pole Ops',
    creatorId,
    inviteCode: overrides.inviteCode ?? 'ABC123',
    participants,
    status: overrides.status ?? 'pending',
    drawDate: overrides.drawDate,
    assignments: overrides.assignments ?? [],
  };
}

type FindMock = {
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  exec: jest.Mock<Promise<RoomDocumentStub[]>, []>;
};

function createFindMock(value: RoomDocumentStub[]): FindMock {
  const m: FindMock = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn<Promise<RoomDocumentStub[]>, []>().mockResolvedValue(value),
  };
  m.sort.mockReturnValue(m);
  m.skip.mockReturnValue(m);
  m.limit.mockReturnValue(m);
  return m;
}

describe('RoomsService', () => {
  let service: RoomsService;
  let roomModel: {
    create: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let redisService: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'del'>>;

  beforeEach(async () => {
    roomModel = {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    usersService = { findById: jest.fn() };
    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getModelToken(Room.name), useValue: roomModel },
        { provide: UsersService, useValue: usersService },
        { provide: RedisService, useValue: redisService },
        { provide: WishlistService, useValue: { findByUser: jest.fn() } },
        { provide: EventPublisherService, useValue: { publish: jest.fn() } },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    jest.clearAllMocks();
  });

  it('create generates a 6-character invite code and seeds the creator', async () => {
    const ownerId = new Types.ObjectId().toString();
    const createdRoom = createRoomDocument({
      creatorId: new Types.ObjectId(ownerId),
      participants: [new Types.ObjectId(ownerId)],
      status: 'pending',
    });

    usersService.findById.mockResolvedValue({ id: ownerId } as never);
    roomModel.findOne.mockReturnValue(createQueryMock(null));
    roomModel.create.mockResolvedValue(createdRoom);

    const room = await service.create({ name: 'North Pole Ops' }, ownerId);

    expect(roomModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'North Pole Ops',
        creatorId: ownerId,
        participants: [ownerId],
        status: 'pending',
        inviteCode: expect.stringMatching(/^[A-Z2-9]{6}$/) as string,
      }),
    );
    expect(room).toMatchObject({
      name: 'North Pole Ops',
      ownerId,
      members: [ownerId],
      status: 'pending',
    });
  });

  it('join is idempotent when the user is already a participant', async () => {
    const userId = new Types.ObjectId().toString();
    const ownerId = new Types.ObjectId();
    const roomDocument = createRoomDocument({
      creatorId: ownerId,
      participants: [ownerId, new Types.ObjectId(userId)],
    });
    const saveMock = jest.fn();
    const roomDocWithSave = { ...roomDocument, save: saveMock };

    usersService.findById.mockResolvedValue({ id: userId } as never);
    roomModel.findById.mockReturnValue(createQueryMock(roomDocWithSave));

    const room = await service.join(
      roomDocument._id.toString(),
      roomDocument.inviteCode,
      userId,
    );

    expect(saveMock).not.toHaveBeenCalled();
    expect(room.participants.map((p) => p.id)).toEqual([
      ownerId.toString(),
      new Types.ObjectId(userId).toString(),
    ]);
  });

  it('join rejects a room that has already been drawn', async () => {
    const userId = new Types.ObjectId().toString();
    usersService.findById.mockResolvedValue({ id: userId } as never);
    roomModel.findById.mockReturnValue(
      createQueryMock(
        createRoomDocument({
          status: 'drawn',
        }),
      ),
    );

    await expect(
      service.join(new Types.ObjectId().toString(), 'ABC123', userId),
    ).rejects.toThrow(BadRequestException);

    expect(roomModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('draw rejects rooms with fewer than 3 participants', async () => {
    const ownerId = new Types.ObjectId();
    const roomDocument = createRoomDocument({
      creatorId: ownerId,
      participants: [ownerId, new Types.ObjectId()],
    });
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.draw(
        roomDocument._id.toString(),
        ownerId.toString(),
        '2025-12-24',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('draw stores assignments and marks the room as drawn', async () => {
    const participants = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];
    const roomId = new Types.ObjectId().toString();
    const roomDocument = createRoomDocument({
      _id: new Types.ObjectId(roomId),
      creatorId: participants[0],
      participants,
      status: 'pending',
    });
    const updatedRoom = createRoomDocument({
      ...roomDocument,
      status: 'drawn',
      drawDate: new Date('2025-12-24T00:00:00.000Z'),
    });

    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));
    roomModel.findByIdAndUpdate.mockReturnValue(createQueryMock(updatedRoom));

    const room = await service.draw(
      roomId,
      participants[0].toString(),
      '2025-12-24',
    );

    expect(roomModel.findByIdAndUpdate).toHaveBeenCalledWith(
      roomId,
      expect.objectContaining({
        status: 'drawn',
        drawDate: expect.any(Date) as Date,
        assignments: expect.arrayContaining([
          expect.objectContaining({ giverId: participants[0] }),
        ]) as RoomDocumentStub['assignments'],
      }),
      { new: true },
    );

    const [, updateArg] = roomModel.findByIdAndUpdate.mock.calls[0] as [
      string,
      { assignments: RoomDocumentStub['assignments'] },
      unknown,
    ];

    expect(updateArg.assignments).toHaveLength(3);
    updateArg.assignments.forEach((assignment) => {
      expect(assignment.giverId.equals(assignment.receiverId)).toBe(false);
    });
    expect(room.status).toBe('drawn');
  });

  it('findByUser returns paginated rooms for a user', async () => {
    const userId = new Types.ObjectId().toString();
    const roomDocument = createRoomDocument({
      participants: [new Types.ObjectId(userId)],
    });

    roomModel.find.mockReturnValue(createFindMock([roomDocument]));
    roomModel.countDocuments.mockReturnValue(createQueryMock(1));

    const result = await service.findByUser(userId, { page: 1, limit: 10 });

    expect(roomModel.find).toHaveBeenCalledWith({ participants: userId });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('findByIdForUser returns the room when user is a participant', async () => {
    const userId = new Types.ObjectId();
    const roomDocument = createRoomDocument({ participants: [userId] });

    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.findByIdForUser(roomDocument._id.toString(), userId.toString()),
    ).resolves.toMatchObject({ id: roomDocument._id.toString() });
  });

  it('findByIdForUser throws ForbiddenException when user is not a participant', async () => {
    const roomDocument = createRoomDocument({
      participants: [new Types.ObjectId()],
    });

    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.findByIdForUser(
        roomDocument._id.toString(),
        new Types.ObjectId().toString(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('joinByCode resolves when the invite code maps to a valid room', async () => {
    const userId = new Types.ObjectId().toString();
    const roomDocument = createRoomDocument({
      participants: [new Types.ObjectId(userId)],
      status: 'pending',
    });
    const saveMock = jest.fn().mockResolvedValue(roomDocument);
    const roomDocWithSave = { ...roomDocument, save: saveMock };

    redisService.get.mockResolvedValue(roomDocument._id.toString());
    roomModel.findById.mockReturnValue(createQueryMock(roomDocWithSave));
    usersService.findById.mockResolvedValue({ id: userId } as never);

    await expect(
      service.joinByCode(roomDocument.inviteCode, userId),
    ).resolves.toBeDefined();
  });

  it('join throws NotFoundException when the room does not exist', async () => {
    const userId = new Types.ObjectId().toString();
    const roomId = new Types.ObjectId().toString();

    roomModel.findById.mockReturnValue(createQueryMock(null));

    await expect(service.join(roomId, 'ABC123', userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('join throws BadRequestException when the invite code is wrong', async () => {
    const userId = new Types.ObjectId().toString();
    const roomDocument = createRoomDocument({ inviteCode: 'CORRECT' });

    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.join(roomDocument._id.toString(), 'WRONG01', userId),
    ).rejects.toThrow(BadRequestException);
  });

  it('draw throws NotFoundException when findByIdAndUpdate returns null', async () => {
    const participants = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];
    const roomDocument = createRoomDocument({
      participants,
      status: 'pending',
    });

    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));
    roomModel.findByIdAndUpdate.mockReturnValue(createQueryMock(null));

    await expect(
      service.draw(
        roomDocument._id.toString(),
        participants[0].toString(),
        '2025-12-24',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
