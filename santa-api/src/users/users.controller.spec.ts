import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    create: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
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
    const fakeUser = { id: '64e000000000000000000001', ...dto };
    mockUsersService.create.mockResolvedValue(fakeUser);

    await expect(controller.create(dto)).resolves.toEqual(fakeUser);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto);
  });

  it('should call service.findById', async () => {
    const fakeUser = {
      id: '64e000000000000000000001',
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

  it('should call service.updateById when updating current user', async () => {
    const id = '64e000000000000000000001';
    const updates = { displayName: 'Jane Updated' };
    const updatedUser = {
      id: id,
      email: 'jane@example.com',
      displayName: 'Jane Updated',
    };
    mockUsersService.updateById.mockResolvedValue(updatedUser);

    await expect(controller.updateMe(id, updates)).resolves.toEqual(
      updatedUser,
    );
    expect(mockUsersService.updateById).toHaveBeenCalledWith(id, updates);
  });

  it('should call service.deleteById when deleting current user', async () => {
    const id = '64e000000000000000000001';
    mockUsersService.deleteById.mockResolvedValue(true);

    await expect(controller.deleteMe(id)).resolves.toEqual({ success: true });
    expect(mockUsersService.deleteById).toHaveBeenCalledWith(id);
  });
});
