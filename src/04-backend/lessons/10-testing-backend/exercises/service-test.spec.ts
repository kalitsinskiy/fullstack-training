// ============================================
// Exercise: Unit Tests for UserService
// ============================================
// Run: npx jest src/04-backend/lessons/10-testing-backend/exercises/service-test.spec.ts

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
  findOne(filter: Record<string, any>): Promise<User | null>;
  findByIdAndUpdate(id: string, data: Partial<User>, options?: any): Promise<User | null>;
  findByIdAndDelete(id: string): Promise<User | null>;
  countDocuments(filter?: Record<string, any>): Promise<number>;
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
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
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
    // TODO: Create mock model with jest.fn() for each method
    // Hint: mockModel = { create: jest.fn(), findById: jest.fn(), ... }
    //
    // TODO: Instantiate UserService with the mock model
    //   service = new UserService(mockModel);
  });

  // Each `it.todo(...)` shows up in jest output as a pending test.
  // Replace each one with a real `it('...', async () => { ... })` as you go.

  // ============================================
  // Group 1: create
  // ============================================
  describe('create', () => {
    it.todo('calls findOne to check for duplicate email and forwards lowercased data to userModel.create');
    it.todo('throws "Email already registered" when findOne returns a user; userModel.create is NOT called');
    it.todo('lowercases the email before storing (input "ALICE@EXAMPLE.COM" → stored "alice@example.com")');
  });

  // ============================================
  // Group 2: findById
  // ============================================
  describe('findById', () => {
    it.todo('returns the user when found and active');
    it.todo('throws "User not found" when findById returns null');
    it.todo('throws "User account is deactivated" when the user exists but isActive is false');
  });

  // ============================================
  // Group 3: updateProfile
  // ============================================
  describe('updateProfile', () => {
    it.todo('successfully updates displayName');
    it.todo('throws "Display name must be at least 2 characters" when displayName is too short (e.g. "A")');
    it.todo('successfully updates email and lowercases it');
    it.todo('throws "Email already in use" when the new email belongs to a different user (findOne returns a user with a different _id)');
    it.todo('throws "User not found" when findByIdAndUpdate returns null');
  });

  // ============================================
  // Group 4: deactivate
  // ============================================
  describe('deactivate', () => {
    it.todo('deactivates a user (sets isActive to false via findByIdAndUpdate)');
    it.todo('throws "User not found" when the user does not exist');
  });

  // ============================================
  // Group 5: getStats
  // ============================================
  describe('getStats', () => {
    // Hint: mockModel.countDocuments.mockImplementation((filter) => { ... })
    // or use mockResolvedValueOnce for the three sequential calls (Promise.all).
    it.todo('returns correct stats: total / active (isActive: true) / admins (role: "admin")');
  });
});
