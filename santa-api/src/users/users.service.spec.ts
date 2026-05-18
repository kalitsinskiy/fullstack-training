import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  const exec = jest.fn();
  const findById = jest.fn(() => ({ exec }));
  const create = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            create,
            findById,
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new user', async () => {
    const createUserDto = {
      displayName: 'John Doe',
      email: 'john.doe@example.com',
    };
    const savedUser = {
      _id: '64e000000000000000000001',
      email: createUserDto.email,
      displayName: createUserDto.displayName,
      passwordHash: 'TODO_LESSON_08',
    };
    create.mockResolvedValue(savedUser);

    const user = await service.create(createUserDto);

    expect(create).toHaveBeenCalledWith({
      email: createUserDto.email,
      displayName: createUserDto.displayName,
      passwordHash: 'TODO_LESSON_08',
    });
    expect(user).toEqual(savedUser);
  });

  it('should find a user by id', async () => {
    const userId = '64e000000000000000000001';
    const user = { _id: userId, email: 'jane.doe@example.com' };
    exec.mockResolvedValue(user);

    const foundUser = await service.findById(userId);

    expect(findById).toHaveBeenCalledWith(userId);
    expect(foundUser).toEqual(user);
  });
});
