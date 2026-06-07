import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

const OWNER_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439012';

const mockService = {
  create: jest.fn<() => Promise<any>>(),
  findByUser: jest.fn<() => Promise<any>>(),
  findById: jest.fn<() => Promise<any>>(),
  join: jest.fn<() => Promise<any>>(),
};

describe('RoomsController', () => {
  let controller: RoomsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: mockService }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  describe('create', () => {
    it('should create and return a new room', async () => {
      const mockRoom = {
        _id: OWNER_ID,
        name: 'Test Room',
        creatorId: OWNER_ID,
        inviteCode: 'ABC123',
        participants: [OWNER_ID],
        status: 'pending',
      };
      mockService.create.mockResolvedValue(mockRoom);

      const result = await controller.create({ name: 'Test Room' }, OWNER_ID);

      expect(result).toEqual(mockRoom);
    });
  });

  describe('findAll', () => {
    it('should return empty data when no rooms exist', async () => {
      mockService.findByUser.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await controller.findAll(OWNER_ID);
      expect(result.data).toEqual([]);
    });

    it('should return paginated rooms', async () => {
      mockService.findByUser.mockResolvedValue({
        data: [{}, {}],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await controller.findAll(OWNER_ID);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a room for a member', async () => {
      const mockRoom = {
        _id: OWNER_ID,
        name: 'Test Room',
        creatorId: { toString: () => OWNER_ID },
        participants: [{ toString: () => OWNER_ID }],
      };
      mockService.findById.mockResolvedValue(mockRoom);

      expect(await controller.findOne(OWNER_ID, OWNER_ID)).toEqual(mockRoom);
    });

    it('should throw NotFoundException for unknown id', async () => {
      mockService.findById.mockResolvedValue(null);

      await expect(controller.findOne(OWNER_ID, OWNER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for non-member', async () => {
      const mockRoom = {
        _id: OWNER_ID,
        name: 'Test Room',
        creatorId: { toString: () => OWNER_ID },
        participants: [{ toString: () => OWNER_ID }],
      };
      mockService.findById.mockResolvedValue(mockRoom);

      await expect(controller.findOne(OWNER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('join', () => {
    it('should join a room and return the updated room', async () => {
      const mockRoom = { participants: [OWNER_ID, USER_ID] };
      mockService.join.mockResolvedValue(mockRoom);

      expect(await controller.join('ABC123', USER_ID)).toEqual(mockRoom);
    });
  });
});
