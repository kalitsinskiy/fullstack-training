import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Reflector } from '@nestjs/core';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomPermissionsGuard } from './guards/room-permissions.guard';
import { Room } from './schemas/room.schema';

describe('RoomsController', () => {
  let controller: RoomsController;
  const mockRoomsService = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findByIdForUser: jest.fn(),
    join: jest.fn(),
    joinByCode: jest.fn(),
    draw: jest.fn(),
    getAssignment: jest.fn(),
    editRoom: jest.fn(),
    deleteRoom: jest.fn(),
    kickMember: jest.fn(),
    regenerateInviteCode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        { provide: RoomsService, useValue: mockRoomsService },
        { provide: getModelToken(Room.name), useValue: {} },
        RoomPermissionsGuard,
        Reflector,
      ],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to service.create with dto and userId', async () => {
      const dto = { name: 'Test Room' };
      const fakeRoom = { id: 'room-id', name: 'Test Room', status: 'pending' };
      mockRoomsService.create.mockResolvedValue(fakeRoom);

      const result = await controller.create(dto as any, 'user-id');

      expect(mockRoomsService.create).toHaveBeenCalledWith(dto, 'user-id');
      expect(result).toEqual(fakeRoom);
    });
  });

  describe('findAll', () => {
    it('delegates to service.findByUser with userId and pagination', async () => {
      const response = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };
      mockRoomsService.findByUser.mockResolvedValue(response);

      const result = await controller.findAll('user-id', 1, 10);

      expect(mockRoomsService.findByUser).toHaveBeenCalledWith('user-id', { page: 1, limit: 10 });
      expect(result).toEqual(response);
    });
  });

  describe('findById', () => {
    it('delegates to service.findByIdForUser with id and userId', async () => {
      const fakeRoom = { id: 'room-id', name: 'Room' };
      mockRoomsService.findByIdForUser.mockResolvedValue(fakeRoom);

      const result = await controller.findById('room-id', 'user-id');

      expect(mockRoomsService.findByIdForUser).toHaveBeenCalledWith('room-id', 'user-id');
      expect(result).toEqual(fakeRoom);
    });
  });

  describe('joinByCode', () => {
    it('delegates to service.joinByCode with inviteCode and userId', async () => {
      const fakeRoom = { id: 'room-id', name: 'Room' };
      mockRoomsService.joinByCode.mockResolvedValue(fakeRoom);

      const result = await controller.joinByCode({ inviteCode: 'ABC123' } as any, 'user-id');

      expect(mockRoomsService.joinByCode).toHaveBeenCalledWith('ABC123', 'user-id');
      expect(result).toEqual(fakeRoom);
    });
  });

  describe('join', () => {
    it('delegates to service.join with id, inviteCode, userId', async () => {
      const fakeRoom = { id: 'room-id', name: 'Room' };
      mockRoomsService.join.mockResolvedValue(fakeRoom);

      const result = await controller.join('room-id', { inviteCode: 'XYZ' } as any, 'user-id');

      expect(mockRoomsService.join).toHaveBeenCalledWith('room-id', 'XYZ', 'user-id');
      expect(result).toEqual(fakeRoom);
    });
  });

  describe('draw', () => {
    it('delegates to service.draw with id, userId, exchangeDate', async () => {
      const fakeRoom = { id: 'room-id', status: 'drawn' };
      mockRoomsService.draw.mockResolvedValue(fakeRoom);

      const result = await controller.draw('room-id', { exchangeDate: '2026-12-24' } as any, 'user-id');

      expect(mockRoomsService.draw).toHaveBeenCalledWith('room-id', 'user-id', '2026-12-24');
      expect(result).toEqual(fakeRoom);
    });
  });

  describe('getAssignment', () => {
    it('delegates to service.getAssignment with id and userId', async () => {
      const assignment = { receiver: { id: 'giftee-id', displayName: 'Bob', wishlist: [] } };
      mockRoomsService.getAssignment.mockResolvedValue(assignment);

      const result = await controller.getAssignment('room-id', 'user-id');

      expect(mockRoomsService.getAssignment).toHaveBeenCalledWith('room-id', 'user-id');
      expect(result).toEqual(assignment);
    });
  });

  describe('edit', () => {
    it('delegates to service.editRoom', async () => {
      const fakeRoom = { id: 'room-id', name: 'Renamed' };
      mockRoomsService.editRoom.mockResolvedValue(fakeRoom);

      const result = await controller.edit('room-id', { name: 'Renamed' } as any, 'user-id');

      expect(mockRoomsService.editRoom).toHaveBeenCalledWith('room-id', { name: 'Renamed' }, 'user-id');
      expect(result).toEqual(fakeRoom);
    });
  });

  describe('remove', () => {
    it('delegates to service.deleteRoom', async () => {
      mockRoomsService.deleteRoom.mockResolvedValue(undefined);

      await controller.remove('room-id', 'user-id');

      expect(mockRoomsService.deleteRoom).toHaveBeenCalledWith('room-id', 'user-id');
    });
  });

  describe('kick', () => {
    it('delegates to service.kickMember', async () => {
      mockRoomsService.kickMember.mockResolvedValue(undefined);

      await controller.kick('room-id', 'target-id', 'user-id');

      expect(mockRoomsService.kickMember).toHaveBeenCalledWith('room-id', 'target-id', 'user-id');
    });
  });

  describe('regenerateInvite', () => {
    it('delegates to service.regenerateInviteCode', async () => {
      const fakeRoom = { id: 'room-id', inviteCode: 'NEWCODE' };
      mockRoomsService.regenerateInviteCode.mockResolvedValue(fakeRoom);

      const result = await controller.regenerateInvite('room-id', 'user-id');

      expect(mockRoomsService.regenerateInviteCode).toHaveBeenCalledWith('room-id', 'user-id');
      expect(result).toEqual(fakeRoom);
    });
  });
});
