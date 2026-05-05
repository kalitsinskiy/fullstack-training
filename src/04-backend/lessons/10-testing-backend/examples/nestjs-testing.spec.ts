// ============================================
// NestJS Testing Module
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/examples/nestjs-testing.spec.ts
//
// This example shows the pattern for using @nestjs/testing.
// It uses plain classes to simulate NestJS DI without requiring
// the full NestJS framework. The patterns are the same.

// --- Simulated NestJS service + repository ---

// In a real NestJS app, this would use @Injectable() and @InjectModel()
interface User {
  _id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

interface UserRepository {
  create(data: Partial<User>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  updateById(id: string, data: Partial<User>): Promise<User | null>;
  deleteById(id: string): Promise<boolean>;
}

class UsersService {
  constructor(private readonly userRepo: UserRepository) {}

  async createUser(email: string, displayName: string): Promise<User> {
    // Check for duplicate email
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    return this.userRepo.create({
      email: email.toLowerCase(),
      displayName,
      role: 'user',
    });
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepo.findByEmail(email.toLowerCase());
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  async updateDisplayName(id: string, displayName: string): Promise<User> {
    if (displayName.length < 2) {
      throw new Error('Display name must be at least 2 characters');
    }

    const user = await this.userRepo.updateById(id, { displayName });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async promoteToAdmin(id: string): Promise<User> {
    const user = await this.userRepo.updateById(id, { role: 'admin' });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.userRepo.deleteById(id);
    if (!deleted) {
      throw new Error('User not found');
    }
  }
}

// --- Notification service (depends on UsersService) ---

interface NotificationService {
  send(userId: string, message: string): Promise<void>;
}

class RoomService {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
  ) {}

  async inviteUser(roomName: string, userId: string): Promise<string> {
    // Verify user exists
    const user = await this.usersService.getUser(userId);

    // Send notification
    await this.notificationService.send(userId, `You were invited to ${roomName}`);

    return `Invitation sent to ${user.displayName}`;
  }
}

// --- Tests ---

/*
  In a real NestJS app, you would use:

  const module = await Test.createTestingModule({
    providers: [
      UsersService,
      {
        provide: 'USER_REPOSITORY',
        useValue: mockUserRepo,
      },
    ],
  }).compile();

  const service = module.get<UsersService>(UsersService);

  Below we simulate the same pattern with plain DI.
*/

describe('UsersService (NestJS Testing Pattern)', () => {
  let service: UsersService;
  let mockRepo: jest.Mocked<UserRepository>;

  function createMockUser(overrides: Partial<User> = {}): User {
    return {
      _id: 'user-1',
      email: 'alice@example.com',
      displayName: 'Alice',
      passwordHash: '$2b$10$hashed',
      role: 'user',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      ...overrides,
    };
  }

  beforeEach(() => {
    // This is equivalent to providing a mock via Test.createTestingModule
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    service = new UsersService(mockRepo);
  });

  describe('createUser', () => {
    it('should create a user with lowercase email', async () => {
      const expected = createMockUser({ email: 'alice@example.com' });
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(expected);

      const result = await service.createUser('Alice@Example.com', 'Alice');

      expect(mockRepo.findByEmail).toHaveBeenCalledWith('Alice@Example.com');
      expect(mockRepo.create).toHaveBeenCalledWith({
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'user',
      });
      expect(result.email).toBe('alice@example.com');
    });

    it('should throw if email is already registered', async () => {
      mockRepo.findByEmail.mockResolvedValue(createMockUser());

      await expect(service.createUser('alice@example.com', 'Alice'))
        .rejects.toThrow('Email already registered');

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      const user = createMockUser();
      mockRepo.findById.mockResolvedValue(user);

      const result = await service.getUser('user-1');
      expect(result).toEqual(user);
    });

    it('should throw if user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getUser('nope')).rejects.toThrow('User not found');
    });
  });

  describe('updateDisplayName', () => {
    it('should update the display name', async () => {
      const updated = createMockUser({ displayName: 'Bob' });
      mockRepo.updateById.mockResolvedValue(updated);

      const result = await service.updateDisplayName('user-1', 'Bob');
      expect(result.displayName).toBe('Bob');
    });

    it('should reject display name shorter than 2 chars', async () => {
      await expect(service.updateDisplayName('user-1', 'A'))
        .rejects.toThrow('Display name must be at least 2 characters');

      expect(mockRepo.updateById).not.toHaveBeenCalled();
    });
  });

  describe('promoteToAdmin', () => {
    it('should set role to admin', async () => {
      const admin = createMockUser({ role: 'admin' });
      mockRepo.updateById.mockResolvedValue(admin);

      const result = await service.promoteToAdmin('user-1');

      expect(mockRepo.updateById).toHaveBeenCalledWith('user-1', { role: 'admin' });
      expect(result.role).toBe('admin');
    });
  });

  describe('deleteUser', () => {
    it('should delete the user', async () => {
      mockRepo.deleteById.mockResolvedValue(true);

      await expect(service.deleteUser('user-1')).resolves.toBeUndefined();
    });

    it('should throw if user not found', async () => {
      mockRepo.deleteById.mockResolvedValue(false);

      await expect(service.deleteUser('nope')).rejects.toThrow('User not found');
    });
  });
});

describe('RoomService (Multiple Dependencies)', () => {
  let roomService: RoomService;
  let mockUsersService: jest.Mocked<Pick<UsersService, 'getUser'>>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Mock both dependencies
    mockUsersService = {
      getUser: jest.fn(),
    };

    mockNotificationService = {
      send: jest.fn(),
    };

    roomService = new RoomService(
      mockUsersService as any,
      mockNotificationService,
    );
  });

  describe('inviteUser', () => {
    it('should send invitation to existing user', async () => {
      mockUsersService.getUser.mockResolvedValue({
        _id: 'user-1',
        email: 'bob@example.com',
        displayName: 'Bob',
        passwordHash: '$2b$10$hashed',
        role: 'user',
        isActive: true,
        createdAt: new Date('2025-01-01'),
      });
      mockNotificationService.send.mockResolvedValue(undefined);

      const result = await roomService.inviteUser('Holiday Party', 'user-1');

      expect(mockUsersService.getUser).toHaveBeenCalledWith('user-1');
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        'user-1',
        'You were invited to Holiday Party',
      );
      expect(result).toBe('Invitation sent to Bob');
    });

    it('should throw if user does not exist', async () => {
      mockUsersService.getUser.mockRejectedValue(new Error('User not found'));

      await expect(roomService.inviteUser('Party', 'bad-id'))
        .rejects.toThrow('User not found');

      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });
  });
});
