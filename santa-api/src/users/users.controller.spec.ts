import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    create: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();
    controller = module.get(UsersController);
  });

  it('should call service.create with the dto', async () => {
    const dto = { displayName: 'John', email: 'john@example.com' };
    const fakeUser = { _id: '64e000000000000000000001', ...dto };
    mockUsersService.create.mockResolvedValue(fakeUser);

    await expect(controller.create(dto)).resolves.toEqual(fakeUser);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto);
  });

  it('should call service.findById', async () => {
    const fakeUser = {
      _id: '64e000000000000000000001',
      displayName: 'John',
      email: 'john@example.com',
    };
    mockUsersService.findById.mockResolvedValue(fakeUser);

    await expect(controller.findById('1')).resolves.toEqual(fakeUser);
    expect(mockUsersService.findById).toHaveBeenCalledWith('1');
  });

  it('should throw NotFoundException when user not found', async () => {
    mockUsersService.findById.mockResolvedValue(null);

    await expect(controller.findById('non-existing-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockUsersService.findById).toHaveBeenCalledWith('non-existing-id');
  });
});
