import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';

describe('RoomsController', () => {
  let controller: RoomsController;
  const mockRoomsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    addMember: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: mockRoomsService }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create with the dto', async () => {
    const dto = {
      name: 'Test Room',
      ownerId: 'a4883b3e-4f49-4b99-9d34-6bfc8fda0ce5',
    };
    const fakeRoom = { _id: '64e000000000000000000001', ...dto };
    mockRoomsService.create.mockResolvedValue(fakeRoom);

    await expect(controller.create(dto)).resolves.toEqual(fakeRoom);
    expect(mockRoomsService.create).toHaveBeenCalledWith(dto);
  });

  it('should call service.findAll', async () => {
    const fakeRooms = [
      {
        _id: '1',
        name: 'Room 1',
        ownerId: '1',
        inviteCode: '123ABC',
        participants: ['1', '4'],
      },
      {
        _id: '2',
        name: 'Room 2',
        ownerId: '2',
        inviteCode: '456DEF',
        participants: ['2', '3'],
      },
    ];
    mockRoomsService.findAll.mockResolvedValue(fakeRooms);

    await expect(controller.findAll()).resolves.toEqual(fakeRooms);
    expect(mockRoomsService.findAll).toHaveBeenCalled();
  });

  it('should call service.findById', async () => {
    const id = '1';
    const fakeRoom = {
      _id: id,
      name: 'Room 1',
      ownerId: '1',
      inviteCode: '123ABC',
      participants: ['1', '4'],
    };
    mockRoomsService.findById.mockResolvedValue(fakeRoom);

    await expect(controller.findById(id)).resolves.toEqual(fakeRoom);
    expect(mockRoomsService.findById).toHaveBeenCalledWith(id);
  });

  it('should throw NotFoundException when room id not found', async () => {
    const id = 'non-existing-id';
    mockRoomsService.findById.mockResolvedValue(undefined);

    await expect(controller.findById(id)).rejects.toThrow(NotFoundException);
    expect(mockRoomsService.findById).toHaveBeenCalledWith(id);
  });

  it('should call service.findByCode and service.addMember', async () => {
    const code = '123';
    const userId = '8ad26f7f-b1a5-4e90-8e74-79f4f34b0d9c';
    const fakeRoom = {
      _id: '1',
      name: 'Room 1',
      ownerId: '1',
      inviteCode: code,
      participants: ['1', '4', userId],
    };
    mockRoomsService.findByCode.mockResolvedValue(fakeRoom);
    mockRoomsService.addMember.mockResolvedValue(fakeRoom);

    await expect(controller.join(code, { userId })).resolves.toEqual(fakeRoom);
    expect(mockRoomsService.findByCode).toHaveBeenCalledWith(code);
    expect(mockRoomsService.addMember).toHaveBeenCalledWith(code, { userId });
  });

  it('should throw NotFoundException when room code not found', async () => {
    const code = 'non-existing-code';
    const userId = '8ad26f7f-b1a5-4e90-8e74-79f4f34b0d9c';
    mockRoomsService.findByCode.mockResolvedValue(undefined);

    await expect(controller.join(code, { userId })).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRoomsService.findByCode).toHaveBeenCalledWith(code);
  });
});
