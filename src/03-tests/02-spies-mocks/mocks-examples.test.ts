import { EmailService } from './email.service';
import { UserService } from './user.service';

// ============================================
// MOCKS & SPIES — Jest reference
// ============================================

// ============================================
// 1. jest.fn() — create a mock function
// ============================================
describe('jest.fn() basics', () => {
  test('tracks whether it was called', () => {
    const mockFn = jest.fn();

    mockFn();

    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('tracks call arguments', () => {
    const mockFn = jest.fn();

    mockFn('hello', 42);
    mockFn('world');

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('hello', 42);
    expect(mockFn).toHaveBeenLastCalledWith('world');
    expect(mockFn).toHaveBeenNthCalledWith(1, 'hello', 42);
  });

  test('can return values', () => {
    const mockAdd = jest.fn((a: number, b: number) => a + b);
    expect(mockAdd(2, 3)).toBe(5);

    const mockGetUser = jest.fn().mockReturnValue({ id: 1, name: 'Alice' });
    expect(mockGetUser()).toEqual({ id: 1, name: 'Alice' });
  });

  test('mockReturnValueOnce — different values each call', () => {
    const mockRandom = jest
      .fn()
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.5)
      .mockReturnValue(0.9);

    expect(mockRandom()).toBe(0.1);
    expect(mockRandom()).toBe(0.5);
    expect(mockRandom()).toBe(0.9);
    expect(mockRandom()).toBe(0.9);
  });

  test('mockResolvedValue — for async mocks', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ status: 200, data: 'ok' });

    const result = await mockFetch('/api/users');

    expect(result).toEqual({ status: 200, data: 'ok' });
    expect(mockFetch).toHaveBeenCalledWith('/api/users');
  });

  test('mockRejectedValue — simulate errors', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(mockFetch('/api/users')).rejects.toThrow('Network error');
  });
});

// ============================================
// Mock cleanup — why it matters
// ============================================
describe('Mock cleanup — bleed between tests', () => {
  // clearMocks: true in jest.config.js resets .mock.calls and .mock.results
  // BUT it does NOT clear mockReturnValueOnce queue!

  test('problem: unconsumed mockReturnValueOnce bleeds into next test', () => {
    const mockFn = jest.fn().mockReturnValueOnce('first').mockReturnValueOnce('second');

    // Only consume "first" — "second" stays in the queue
    expect(mockFn()).toBe('first');

    // If this test ends here, the "second" value is still queued.
    // The NEXT test that uses the same mock will get "second" unexpectedly!
  });

  test('receives leftover value from previous test if mock is shared', () => {
    // This would be a problem if mockFn were declared in outer scope.
    // Here it is not — each test creates its own mock. Safe.
    // But with spyOn on a singleton or module export, the queue PERSISTS.
  });

  // ─── Solutions ────────────────────────────────────────────────────────────

  // 1. jest.config.js: clearMocks: true  → clears calls/instances/results
  //    but NOT the implementation / returnValueOnce queue
  //
  // 2. jest.config.js: resetMocks: true  → also resets implementation + queue ✅
  //                    restoreMocks: true → additionally restores spyOn originals ✅
  //
  // 3. Manual mockReset() at the end of the test:
  test('manual mockReset clears the queue', () => {
    const mockFn = jest.fn().mockReturnValueOnce('stale');

    expect(mockFn()).toBe('stale');

    mockFn.mockReset(); // clears calls + implementation + remaining queue
    expect(mockFn()).toBeUndefined(); // queue is empty, no implementation
  });

  // 4. Recreate mock in beforeEach (the safest pattern)
  //    — see "UserService with mocked dependencies" below: fresh jest.fn() every test
});

// ============================================
// 2. jest.spyOn() — spy on real methods
// ============================================
describe('jest.spyOn()', () => {
  test('spies on existing method without changing behavior', () => {
    const emailService = new EmailService();
    const spy = jest.spyOn(emailService, 'getSentCount');

    emailService.getSentCount();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('can mock the return value of a spied method', async () => {
    const emailService = new EmailService();
    const spy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

    await emailService.sendEmail({ to: 'a@b.com', subject: 'Test', body: 'Hi' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      to: 'a@b.com',
      subject: 'Test',
      body: 'Hi',
    });
  });

  test('spy on console to suppress output in tests', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    console.log('This will not print');

    expect(consoleSpy).toHaveBeenCalledWith('This will not print');
    consoleSpy.mockRestore();
  });
});

// ============================================
// 3. Testing with injected dependencies
// ============================================
describe('UserService with mocked dependencies', () => {
  let userService: UserService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockLogger: { log: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcome: jest.fn().mockResolvedValue(undefined),
      getSentCount: jest.fn().mockReturnValue(0),
    } as unknown as jest.Mocked<EmailService>;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    userService = new UserService(mockEmailService, mockLogger);
  });

  test('register calls sendWelcome with correct args', async () => {
    await userService.register('Alice', 'alice@example.com');

    expect(mockEmailService.sendWelcome).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendWelcome).toHaveBeenCalledWith('alice@example.com', 'Alice');
  });

  test('register logs the event', async () => {
    await userService.register('Alice', 'alice@example.com');

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('alice@example.com'));
  });

  test('register throws on invalid email', async () => {
    await expect(userService.register('Alice', 'notanemail')).rejects.toThrow('Invalid email');

    expect(mockEmailService.sendWelcome).not.toHaveBeenCalled();
  });

  test('deleteUser logs error when user not found', async () => {
    const result = await userService.deleteUser('non-existent-id');

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  test('deleteUser returns true and logs when user exists', async () => {
    const user = await userService.register('Alice', 'alice@example.com');
    const result = await userService.deleteUser(user.id);

    expect(result).toBe(true);
    expect(mockLogger.log).toHaveBeenLastCalledWith(expect.stringContaining('deleted'));
  });
});
