// ============================================
// Exercise: Unit Tests for UserService
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/exercises/service-test.spec.ts

export {};

// --- The service to test (given to you) ---

interface User {
  _id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
}

interface UserModel {
  create(data: Partial<User>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findOne(filter: Record<string, unknown>): Promise<User | null>;
  findByIdAndUpdate(
    id: string,
    data: Partial<User>,
    options?: { new?: boolean }
  ): Promise<User | null>;
  findByIdAndDelete(id: string): Promise<User | null>;
  countDocuments(filter?: Record<string, unknown>): Promise<number>;
}

class UserService {
  constructor(private readonly userModel: UserModel) {}

  async create(email: string, displayName: string, passwordHash: string): Promise<User> {
    const existing = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error('Email already registered');
    }

    return this.userModel.create({
      email: email.toLowerCase(),
      displayName,
      passwordHash,
      role: 'user',
      isActive: true,
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async updateProfile(id: string, data: { displayName?: string; email?: string }): Promise<User> {
    if (data.displayName !== undefined && data.displayName.length < 2) {
      throw new Error('Display name must be at least 2 characters');
    }

    if (data.email) {
      const existing = await this.userModel.findOne({ email: data.email.toLowerCase() });
      if (existing && existing._id !== id) {
        throw new Error('Email already in use');
      }
      data.email = data.email.toLowerCase();
    }

    const user = await this.userModel.findByIdAndUpdate(id, data, { new: true });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getStats(): Promise<{ total: number; active: number; admins: number }> {
    const [total, active, admins] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ role: 'admin' }),
    ]);
    return { total, active, admins };
  }
}

// --- Your tests ---

describe('UserService', () => {
  let service: UserService;
  let mockModel: jest.Mocked<UserModel>;

  // Helper: create a mock user object
  function mockUser(overrides: Partial<User> = {}): User {
    return {
      _id: 'user-1',
      email: 'taras.shevchenko@example.com',
      displayName: 'Taras Shevchenko',
      passwordHash: '$2b$10$hashed',
      role: 'user',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    service = new UserService(mockModel);
  });

  // Each `it.todo(...)` shows up in jest output as a pending test.
  // Replace each one with a real `it('...', async () => { ... })` as you go.

  // ============================================
  // Group 1: create
  // ============================================
  describe('create', () => {
    it('calls findOne to check for duplicate email and forwards lowercased data to userModel.create', async () => {
      const createdUser = mockUser();
      mockModel.findOne.mockResolvedValue(null);
      mockModel.create.mockResolvedValue(createdUser);

      const result = await service.create(
        'TARAS.SHEVCHENKO@EXAMPLE.COM',
        'Taras Shevchenko',
        'hashed-password'
      );

      expect(mockModel.findOne).toHaveBeenCalledWith({ email: 'taras.shevchenko@example.com' });
      expect(mockModel.create).toHaveBeenCalledWith({
        email: 'taras.shevchenko@example.com',
        displayName: 'Taras Shevchenko',
        passwordHash: 'hashed-password',
        role: 'user',
        isActive: true,
      });
      expect(result).toBe(createdUser);
    });

    it('throws "Email already registered" when findOne returns a user; userModel.create is NOT called', async () => {
      mockModel.findOne.mockResolvedValue(mockUser());

      await expect(
        service.create('taras.shevchenko@example.com', 'Taras Shevchenko', 'hashed-password')
      ).rejects.toThrow('Email already registered');
      expect(mockModel.create).not.toHaveBeenCalled();
    });

    it('lowercases the email before storing (input "TARAS.SHEVCHENKO@EXAMPLE.COM" → stored "taras.shevchenko@example.com")', async () => {
      const createdUser = mockUser({ email: 'taras.shevchenko@example.com' });
      mockModel.findOne.mockResolvedValue(null);
      mockModel.create.mockResolvedValue(createdUser);

      await service.create('TARAS.SHEVCHENKO@EXAMPLE.COM', 'Taras Shevchenko', 'hashed-password');

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'taras.shevchenko@example.com' })
      );
    });
  });

  // ============================================
  // Group 2: findById
  // ============================================
  describe('findById', () => {
    it('returns the user when found and active', async () => {
      const user = mockUser();
      mockModel.findById.mockResolvedValue(user);

      await expect(service.findById('user-1')).resolves.toBe(user);
    });

    it('throws "User not found" when findById returns null', async () => {
      mockModel.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow('User not found');
    });

    it('throws "User account is deactivated" when the user exists but isActive is false', async () => {
      mockModel.findById.mockResolvedValue(mockUser({ isActive: false }));

      await expect(service.findById('user-1')).rejects.toThrow('User account is deactivated');
    });
  });

  // ============================================
  // Group 3: updateProfile
  // ============================================
  describe('updateProfile', () => {
    it('successfully updates displayName', async () => {
      const updatedUser = mockUser({ displayName: 'Ivan Franko' });
      mockModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', { displayName: 'Ivan Franko' });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-1',
        { displayName: 'Ivan Franko' },
        { new: true }
      );
      expect(result).toBe(updatedUser);
    });

    it('throws "Display name must be at least 2 characters" when displayName is too short (e.g. "A")', async () => {
      await expect(service.updateProfile('user-1', { displayName: 'A' })).rejects.toThrow(
        'Display name must be at least 2 characters'
      );
      expect(mockModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('successfully updates email and lowercases it', async () => {
      const updatedUser = mockUser({ email: 'ivan.franko@example.com' });
      mockModel.findOne.mockResolvedValue(null);
      mockModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', { email: 'IVAN.FRANKO@EXAMPLE.COM' });

      expect(mockModel.findOne).toHaveBeenCalledWith({ email: 'ivan.franko@example.com' });
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-1',
        { email: 'ivan.franko@example.com' },
        { new: true }
      );
      expect(result).toBe(updatedUser);
    });

    it('throws "Email already in use" when the new email belongs to a different user (findOne returns a user with a different _id)', async () => {
      mockModel.findOne.mockResolvedValue(mockUser({ _id: 'user-2' }));

      await expect(
        service.updateProfile('user-1', { email: 'ivan.franko@example.com' })
      ).rejects.toThrow('Email already in use');
      expect(mockModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('throws "User not found" when findByIdAndUpdate returns null', async () => {
      mockModel.findOne.mockResolvedValue(null);
      mockModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateProfile('missing', { email: 'ivan.kotliarevsky@example.com' })
      ).rejects.toThrow('User not found');
    });
  });

  // ============================================
  // Group 4: deactivate
  // ============================================
  describe('deactivate', () => {
    it('deactivates a user (sets isActive to false via findByIdAndUpdate)', async () => {
      const updatedUser = mockUser({ isActive: false });
      mockModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.deactivate('user-1');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-1',
        { isActive: false },
        { new: true }
      );
      expect(result).toBe(updatedUser);
    });

    it('throws "User not found" when the user does not exist', async () => {
      mockModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.deactivate('missing')).rejects.toThrow('User not found');
    });
  });

  // ============================================
  // Group 5: getStats
  // ============================================
  describe('getStats', () => {
    // Hint: mockModel.countDocuments.mockImplementation((filter) => { ... })
    // or use mockResolvedValueOnce for the three sequential calls (Promise.all).
    it('returns correct stats: total / active (isActive: true) / admins (role: "admin")', async () => {
      mockModel.countDocuments.mockImplementation(async (filter?: Record<string, unknown>) => {
        if (!filter) {
          return 12;
        }
        if (filter.isActive === true) {
          return 9;
        }
        if (filter.role === 'admin') {
          return 2;
        }
        return 0;
      });

      await expect(service.getStats()).resolves.toEqual({ total: 12, active: 9, admins: 2 });
      expect(mockModel.countDocuments).toHaveBeenCalledWith();
      expect(mockModel.countDocuments).toHaveBeenCalledWith({ isActive: true });
      expect(mockModel.countDocuments).toHaveBeenCalledWith({ role: 'admin' });
    });
  });
});
