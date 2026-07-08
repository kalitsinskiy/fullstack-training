import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    findById: jest.fn(),
    updateCurrentUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findCurrent', () => {
    it('delegates to usersService.findById with the JWT user id', async () => {
      const fakeUser = { id: 'user-id', email: 'a@b.com', displayName: 'Alice', role: 'user' };
      mockUsersService.findById.mockResolvedValue(fakeUser);

      const result = await controller.findCurrent('user-id');

      expect(mockUsersService.findById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(fakeUser);
    });
  });

  describe('updateCurrent', () => {
    it('delegates to usersService.updateCurrentUser', async () => {
      const updated = { id: 'user-id', email: 'a@b.com', displayName: 'New Name', role: 'user' };
      mockUsersService.updateCurrentUser.mockResolvedValue(updated);

      const result = await controller.updateCurrent('user-id', { displayName: 'New Name' });

      expect(mockUsersService.updateCurrentUser).toHaveBeenCalledWith('user-id', { displayName: 'New Name' });
      expect(result).toEqual(updated);
    });
  });
});
