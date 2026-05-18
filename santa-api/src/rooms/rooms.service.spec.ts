import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoomsService } from './rooms.service';
import { Room } from './schemas/room.schema';

describe('RoomsService', () => {
  let service: RoomsService;
  const exec = jest.fn();
  const create = jest.fn();
  const find = jest.fn(() => ({ exec }));
  const findById = jest.fn(() => ({ exec }));
  const findOne = jest.fn(() => ({ exec }));
  const findOneAndUpdate = jest.fn(() => ({ exec }));

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getModelToken(Room.name),
          useValue: {
            create,
            find,
            findById,
            findOne,
            findOneAndUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a room', async () => {
    const dto = {
      name: 'Test Room',
      ownerId: 'a4883b3e-4f49-4b99-9d34-6bfc8fda0ce5',
    };
    const savedRoom = { _id: '64e000000000000000000001', ...dto };
    create.mockResolvedValue(savedRoom);

    const room = await service.create(dto);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: dto.name,
        creatorId: dto.ownerId,
        participants: [dto.ownerId],
      }),
    );
    expect(create.mock.calls[0][0].inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(room).toEqual(savedRoom);
  });

  it('should find all rooms', async () => {
    const roomList = [{ _id: '1' }, { _id: '2' }];
    exec.mockResolvedValue(roomList);

    const rooms = await service.findAll();

    expect(find).toHaveBeenCalled();
    expect(rooms).toEqual(roomList);
  });

  it('should find a room by id', async () => {
    const id = '64e000000000000000000001';
    const room = { _id: id, name: 'Test Room' };
    exec.mockResolvedValue(room);

    const foundRoom = await service.findById(id);

    expect(findById).toHaveBeenCalledWith(id);
    expect(foundRoom).toEqual(room);
  });

  it('should find a room by code', async () => {
    const code = 'ABC123';
    const room = { _id: '64e000000000000000000001', inviteCode: code };
    exec.mockResolvedValue(room);

    const foundRoom = await service.findByCode(code);

    expect(findOne).toHaveBeenCalledWith({ inviteCode: code });
    expect(foundRoom).toEqual(room);
  });

  it('should add a member to a room', async () => {
    const code = 'ABC123';
    const joinData = { userId: '8ad26f7f-b1a5-4e90-8e74-79f4f34b0d9c' };
    const updatedRoom = {
      _id: '64e000000000000000000001',
      participants: ['x'],
    };
    exec.mockResolvedValue(updatedRoom);

    const result = await service.addMember(code, joinData);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { inviteCode: code },
      { $addToSet: { participants: joinData.userId } },
      { new: true },
    );
    expect(result).toEqual(updatedRoom);
  });
});
