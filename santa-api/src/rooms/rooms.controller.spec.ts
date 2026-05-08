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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: mockRoomsService }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create with the dto', () => {
    const dto = { name: 'Test Room', ownerId: '1' };
    const fakeRoom = { id: '1', code: '123', members: ['1'], ...dto };
    mockRoomsService.create.mockReturnValue(fakeRoom);
    const result = controller.create(dto);
    expect(result).toEqual(fakeRoom);
    expect(mockRoomsService.create).toHaveBeenCalledWith(dto);
  });

  it('should call service.findAll', () => {
    const fakeRooms = [
      {
        id: '1',
        name: 'Room 1',
        ownerId: '1',
        code: '123',
        members: ['1', '4'],
      },
      {
        id: '2',
        name: 'Room 2',
        ownerId: '2',
        code: '456',
        members: ['2', '3'],
      },
    ];
    mockRoomsService.findAll.mockReturnValue(fakeRooms);
    const result = controller.findAll();
    expect(result).toEqual(fakeRooms);
    expect(mockRoomsService.findAll).toHaveBeenCalled();
  });

  it('should call service.findById', () => {
    const id = '1';
    const fakeRoom = {
      id,
      name: 'Room 1',
      ownerId: '1',
      code: '123',
      members: ['1', '4'],
    };
    mockRoomsService.findById.mockReturnValue(fakeRoom);
    const result = controller.findById(id);
    expect(result).toEqual(fakeRoom);
    expect(mockRoomsService.findById).toHaveBeenCalledWith(id);
  });

  it('should throw NotFoundException when room not found', () => {
    const id = 'non-existing-id';
    mockRoomsService.findById.mockReturnValue(undefined);
    expect(() => controller.findById(id)).toThrow(NotFoundException);
    expect(mockRoomsService.findById).toHaveBeenCalledWith(id);
  });

  it('should call service.findByCode and service.addMember', () => {
    const code = '123';
    const userId = '3';
    const fakeRoom = {
      id: '1',
      name: 'Room 1',
      ownerId: '1',
      code,
      members: ['1', '4', userId],
    };
    mockRoomsService.findByCode.mockReturnValue(fakeRoom);
    mockRoomsService.addMember.mockReturnValue(fakeRoom);
    const result = controller.join(code, { userId });
    expect(result).toEqual(fakeRoom);
    expect(mockRoomsService.findByCode).toHaveBeenCalledWith(code);
    expect(mockRoomsService.addMember).toHaveBeenCalledWith(code, userId);
  });

  it('should throw NotFoundException when room not found', () => {
    const code = 'non-existing-code';
    const userId = '3';
    mockRoomsService.findByCode.mockReturnValue(undefined);
    expect(() => controller.join(code, { userId })).toThrow(NotFoundException);
    expect(mockRoomsService.findByCode).toHaveBeenCalledWith(code);
  });
});
