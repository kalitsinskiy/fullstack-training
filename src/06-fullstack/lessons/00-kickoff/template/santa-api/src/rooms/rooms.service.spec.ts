import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
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
    findByIdAndUpdate: jest.Mock;
  };
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let wishlistService: jest.Mocked<Pick<WishlistService, 'get'>>;

  beforeEach(async () => {
    roomModel = {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    usersService = {
      findById: jest.fn(),
    };
    wishlistService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getModelToken(Room.name), useValue: roomModel },
        { provide: UsersService, useValue: usersService },
        { provide: WishlistService, useValue: wishlistService },
      ],
    }).compile();

    service = module.get(RoomsService);
    jest.clearAllMocks();
  });

  it('create generates a 6-character invite code and seeds the creator', async () => {
    const creatorId = new Types.ObjectId().toString();
    const createdRoom = createRoomDocument({
      creatorId: new Types.ObjectId(creatorId),
      participants: [new Types.ObjectId(creatorId)],
      status: 'pending',
    });

    usersService.findById.mockResolvedValue({ id: creatorId } as never);
    roomModel.findOne.mockReturnValue(createQueryMock(null));
    roomModel.create.mockResolvedValue(createdRoom);

    const room = await service.create({ name: 'North Pole Ops' }, creatorId);

    expect(roomModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'North Pole Ops',
        creatorId,
        participants: [creatorId],
        status: 'pending',
        inviteCode: expect.stringMatching(/^[A-Z2-9]{6}$/) as string,
      }),
    );
    expect(room).toMatchObject({
      name: 'North Pole Ops',
      creatorId,
      participants: [creatorId],
      participantCount: 1,
      status: 'pending',
    });
  });

  it('findById returns a room when present', async () => {
    const roomDocument = createRoomDocument();
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.findById(roomDocument._id.toString()),
    ).resolves.toMatchObject({
      id: roomDocument._id.toString(),
      inviteCode: roomDocument.inviteCode,
    });
  });

  it('findById throws when the room does not exist', async () => {
    roomModel.findById.mockReturnValue(createQueryMock(null));

    await expect(
      service.findById(new Types.ObjectId().toString()),
    ).rejects.toThrow(NotFoundException);
  });

  it('join adds the user with $addToSet when the invite code matches', async () => {
    const userId = new Types.ObjectId().toString();
    const creatorId = new Types.ObjectId();
    const roomDocument = createRoomDocument({ creatorId });
    const updatedRoom = createRoomDocument({
      _id: roomDocument._id,
      creatorId,
      inviteCode: roomDocument.inviteCode,
      participants: [creatorId, new Types.ObjectId(userId)],
    });

    usersService.findById.mockResolvedValue({ id: userId } as never);
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));
    roomModel.findByIdAndUpdate.mockReturnValue(createQueryMock(updatedRoom));

    const room = await service.join(
      roomDocument._id.toString(),
      roomDocument.inviteCode,
      userId,
    );

    expect(roomModel.findByIdAndUpdate).toHaveBeenCalledWith(
      roomDocument._id.toString(),
      { $addToSet: { participants: new Types.ObjectId(userId) } },
      { new: true },
    );
    expect(room.participantCount).toBe(2);
  });

  it('join rejects a wrong invite code with BadRequestException', async () => {
    const userId = new Types.ObjectId().toString();
    const roomDocument = createRoomDocument({ inviteCode: 'RIGHT1' });

    usersService.findById.mockResolvedValue({ id: userId } as never);
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.join(roomDocument._id.toString(), 'WRONG1', userId),
    ).rejects.toThrow(BadRequestException);
    expect(roomModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('join rejects a room that has already been drawn', async () => {
    const userId = new Types.ObjectId().toString();
    const roomDocument = createRoomDocument({ status: 'drawn' });

    usersService.findById.mockResolvedValue({ id: userId } as never);
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.join(roomDocument._id.toString(), roomDocument.inviteCode, userId),
    ).rejects.toThrow(ForbiddenException);
    expect(roomModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('join throws NotFoundException when the room does not exist', async () => {
    const userId = new Types.ObjectId().toString();

    usersService.findById.mockResolvedValue({ id: userId } as never);
    roomModel.findById.mockReturnValue(createQueryMock(null));

    await expect(
      service.join(new Types.ObjectId().toString(), 'ABC123', userId),
    ).rejects.toThrow(NotFoundException);
    expect(roomModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('draw rejects a non-creator with ForbiddenException', async () => {
    const creatorId = new Types.ObjectId();
    const roomDocument = createRoomDocument({
      creatorId,
      participants: [creatorId, new Types.ObjectId(), new Types.ObjectId()],
    });
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.draw(roomDocument._id.toString(), new Types.ObjectId().toString()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('draw rejects rooms with fewer than 3 participants', async () => {
    const creatorId = new Types.ObjectId();
    const roomDocument = createRoomDocument({
      creatorId,
      participants: [creatorId, new Types.ObjectId()],
    });
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.draw(roomDocument._id.toString(), creatorId.toString()),
    ).rejects.toThrow(BadRequestException);
  });

  it('draw rejects a room that is already drawn', async () => {
    const creatorId = new Types.ObjectId();
    const roomDocument = createRoomDocument({
      creatorId,
      participants: [creatorId, new Types.ObjectId(), new Types.ObjectId()],
      status: 'drawn',
    });
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.draw(roomDocument._id.toString(), creatorId.toString()),
    ).rejects.toThrow(BadRequestException);
  });

  it('draw stores a derangement and marks the room as drawn', async () => {
    const participants = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];
    const roomDocument = createRoomDocument({
      creatorId: participants[0],
      participants,
      status: 'pending',
    });
    const updatedRoom = createRoomDocument({
      _id: roomDocument._id,
      creatorId: participants[0],
      participants,
      status: 'drawn',
      drawDate: new Date('2025-12-24T00:00:00.000Z'),
    });

    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));
    roomModel.findByIdAndUpdate.mockReturnValue(createQueryMock(updatedRoom));

    const room = await service.draw(
      roomDocument._id.toString(),
      participants[0].toString(),
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

  it('draw throws NotFoundException when findByIdAndUpdate returns null', async () => {
    const participants = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];
    const roomDocument = createRoomDocument({
      creatorId: participants[0],
      participants,
      status: 'pending',
    });

    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));
    roomModel.findByIdAndUpdate.mockReturnValue(createQueryMock(null));

    await expect(
      service.draw(roomDocument._id.toString(), participants[0].toString()),
    ).rejects.toThrow(NotFoundException);
  });

  it('getAssignment returns the receiver with their wishlist item names', async () => {
    const giver = new Types.ObjectId();
    const receiver = new Types.ObjectId();
    const roomDocument = createRoomDocument({
      creatorId: giver,
      participants: [giver, receiver, new Types.ObjectId()],
      status: 'drawn',
      assignments: [{ giverId: giver, receiverId: receiver }],
    });

    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));
    usersService.findById.mockResolvedValue({
      id: receiver.toString(),
      displayName: 'Rudolph',
    } as never);
    wishlistService.get.mockResolvedValue({
      roomId: roomDocument._id.toString(),
      userId: receiver.toString(),
      items: ['Carrots', 'A red nose'],
    } as never);

    const result = await service.getAssignment(
      roomDocument._id.toString(),
      giver.toString(),
    );

    expect(result).toEqual({
      receiver: {
        id: receiver.toString(),
        displayName: 'Rudolph',
        wishlist: ['Carrots', 'A red nose'],
      },
    });
  });

  it('getAssignment throws when the draw is not complete', async () => {
    const giver = new Types.ObjectId();
    const roomDocument = createRoomDocument({
      creatorId: giver,
      participants: [giver],
      status: 'pending',
    });
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.getAssignment(roomDocument._id.toString(), giver.toString()),
    ).rejects.toThrow(BadRequestException);
  });

  it('getAssignment throws ForbiddenException when user is not a participant', async () => {
    const roomDocument = createRoomDocument({
      participants: [new Types.ObjectId()],
      status: 'drawn',
    });
    roomModel.findById.mockReturnValue(createQueryMock(roomDocument));

    await expect(
      service.getAssignment(
        roomDocument._id.toString(),
        new Types.ObjectId().toString(),
      ),
    ).rejects.toThrow(ForbiddenException);
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
});
