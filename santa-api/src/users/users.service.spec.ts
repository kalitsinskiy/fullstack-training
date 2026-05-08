import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new user', () => {
    const createUserDto = { name: 'John Doe', email: 'john.doe@example.com' };
    const user = service.create(createUserDto);
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');
    expect(user.name).toBe(createUserDto.name);
    expect(user.email).toBe(createUserDto.email);
  });

  it('should find a user by id', () => {
    const createUserDto = { name: 'Jane Doe', email: 'jane.doe@example.com' };
    const user = service.create(createUserDto);
    const foundUser = service.findById(user.id);
    expect(foundUser).toEqual(user);
  });

  it('should return undefined for non-existing user', () => {
    const foundUser = service.findById('non-existing-id');
    expect(foundUser).toBeUndefined();
  });
});
