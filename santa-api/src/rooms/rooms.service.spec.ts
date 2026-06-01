import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { RoomsRepository } from './repositories/rooms.repository';

describe('RoomsService', () => {
  let service: RoomsService;
  const create = jest.fn();
  const findAll = jest.fn();
  const findById = jest.fn();
  const findByCode = jest.fn();
  const addMember = jest.fn();
  const updateById = jest.fn();
  const deleteById = jest.fn();

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
            updateById,
            deleteById,
          },
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate create to the repository', async () => {
    const dto = { name: 'Test Room', ownerId: 'creator-id' };
    const savedRoom = { id: 'room-id', ...dto };
    create.mockResolvedValue(savedRoom);

    const result = await service.create(dto);

    expect(create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(savedRoom);
  });

  it('should delegate findAll to the repository', async () => {
    const response = {
      data: [{ id: 'room1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    findAll.mockResolvedValue(response);

    const result = await service.findAll(1, 10);

    expect(findAll).toHaveBeenCalledWith(1, 10);
    expect(result).toBe(response);
  });

  it('should delegate findById to the repository', async () => {
    const room = { id: 'room-id', name: 'Test Room' };
    findById.mockResolvedValue(room);

    const result = await service.findById('room-id');

    expect(findById).toHaveBeenCalledWith('room-id');
    expect(result).toEqual(room);
  });

  it('should delegate findByCode to the repository', async () => {
    const room = { id: 'room-id', inviteCode: 'ABC123' };
    findByCode.mockResolvedValue(room);

    const result = await service.findByCode('ABC123');

    expect(findByCode).toHaveBeenCalledWith('ABC123');
    expect(result).toEqual(room);
  });

  it('should delegate addMember to the repository', async () => {
    const updatedRoom = { id: 'room-id', participants: ['user-id'] };
    addMember.mockResolvedValue(updatedRoom);

    const result = await service.addMember('ABC123', {
      userId: 'user-id',
    });

    expect(addMember).toHaveBeenCalledWith('ABC123', { userId: 'user-id' });
    expect(result).toEqual(updatedRoom);
  });

  it('should delegate updateById to the repository', async () => {
    const updatedRoom = { id: 'room-id', name: 'New Name' };
    updateById.mockResolvedValue(updatedRoom);

    const result = await service.updateById('room-id', { name: 'New Name' });

    expect(updateById).toHaveBeenCalledWith('room-id', { name: 'New Name' });
    expect(result).toEqual(updatedRoom);
  });

  it('should delegate deleteById to the repository', async () => {
    deleteById.mockResolvedValue(true);

    const result = await service.deleteById('room-id');

    expect(deleteById).toHaveBeenCalledWith('room-id');
    expect(result).toBe(true);
  });
});
