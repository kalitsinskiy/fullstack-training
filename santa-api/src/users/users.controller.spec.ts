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
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();
    controller = module.get(UsersController);
  });

  it('should call service.create with the dto', () => {
    const dto = { name: 'John', email: 'john@example.com' };
    const fakeUser = { id: '1', ...dto, createdAt: new Date() };
    mockUsersService.create.mockReturnValue(fakeUser);

    expect(controller.create(dto)).toEqual(fakeUser);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto);
  });

  it('should call service.findById', () => {
    const fakeUser = { id: '1', name: 'John', email: 'john@example.com' };
    mockUsersService.findById.mockReturnValue(fakeUser);

    expect(controller.findById('1')).toEqual(fakeUser);
    expect(mockUsersService.findById).toHaveBeenCalledWith('1');
  });

  it('should throw NotFoundException when user not found', () => {
    mockUsersService.findById.mockReturnValue(undefined);
    expect(() => controller.findById('non-existing-id')).toThrow(
      NotFoundException,
    );
    expect(mockUsersService.findById).toHaveBeenCalledWith('non-existing-id');
  });
});
