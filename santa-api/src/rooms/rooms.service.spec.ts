import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { Room } from './schemas/room.schema';
import { RoomsRepository } from './repositories/rooms.repository';

describe('RoomsService', () => {
  let service: RoomsService;
  const create = jest.fn();
  const findAll = jest.fn();
  const findById = jest.fn();
  const findByCode = jest.fn();
  const addMember = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: RoomsRepository,
          useValue: {
            create,
            findAll,
            findById,
            findByCode,
            addMember,
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
    const savedRoom = { id: '64e000000000000000000001', ...dto };
    create.mockResolvedValue(savedRoom);

    const room = await service.create(dto);

    expect(create).toHaveBeenCalledWith(dto);
    expect(room).toEqual(savedRoom);
  });

  it('should find all rooms', async () => {
    const roomList = [{ id: '1' }, { id: '2' }];
    findAll.mockResolvedValue(roomList);

    const rooms = await service.findAll();

    expect(findAll).toHaveBeenCalled();
    expect(rooms).toEqual(roomList);
  });

  it('should find a room by id', async () => {
    const id = '64e000000000000000000001';
    const room = { id: id, name: 'Test Room' };
    findById.mockResolvedValue(room);

    const foundRoom = await service.findById(id);

    expect(findById).toHaveBeenCalledWith(id);
    expect(foundRoom).toEqual(room);
  });

  it('should find a room by code', async () => {
    const code = 'ABC123';
    const room = { id: '64e000000000000000000001', inviteCode: code };
    findByCode.mockResolvedValue(room);

    const foundRoom = await service.findByCode(code);

    expect(findByCode).toHaveBeenCalledWith(code);
    expect(foundRoom).toEqual(room);
  });

  it('should add a member to a room', async () => {
    const code = 'ABC123';
    const joinData = { userId: '8ad26f7f-b1a5-4e90-8e74-79f4f34b0d9c' };
    const updatedRoom = {
      id: '64e000000000000000000001',
      participants: ['x'],
    };
    addMember.mockResolvedValue(updatedRoom);

    const result = await service.addMember(code, joinData);

    expect(addMember).toHaveBeenCalledWith(code, joinData);
    expect(result).toEqual(updatedRoom);
  });
});
