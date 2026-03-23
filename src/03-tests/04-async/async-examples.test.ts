import { fetchUser, fetchUsers, retryOperation, debounce, scheduleTask, scheduleRepeating } from './api';

// ============================================
// ASYNC TESTING — Jest reference
// ============================================

// ============================================
// 1. async/await in tests
// ============================================
describe('async/await in tests', () => {
  test('fetchUser returns a user', async () => {
    const user = await fetchUser('123');

    expect(user).toEqual({
      id: '123',
      name: 'User 123',
      email: '123@example.com',
    });
  });

  test('fetchUsers returns array of users', async () => {
    const users = await fetchUsers();

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Alice');
  });
});

// ============================================
// 2. Testing rejections
// ============================================
describe('Testing async errors', () => {
  // Method 1: await + try/catch (verbose but explicit)
  test('fetchUser throws for empty id — try/catch', async () => {
    try {
      await fetchUser('');
      fail('Expected to throw'); // will fail the test if we get here
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBe('ID is required');
    }
  });

  // Method 2: rejects matcher (preferred — cleaner)
  test('fetchUser throws for empty id — rejects', async () => {
    await expect(fetchUser('')).rejects.toThrow('ID is required');
  });

  test('fetchUser throws for not-found', async () => {
    await expect(fetchUser('not-found')).rejects.toThrow('User not found');
  });

  // Method 3: .resolves
  test('fetchUser resolves with correct user', async () => {
    await expect(fetchUser('42')).resolves.toMatchObject({
      id: '42',
      name: 'User 42',
    });
  });
});

// ============================================
// 3. Fake timers — control time in tests
// ============================================
describe('jest.useFakeTimers()', () => {
  beforeEach(() => {
    jest.useFakeTimers(); // replace setTimeout, setInterval, Date with fakes
  });

  afterEach(() => {
    jest.useRealTimers(); // restore real timers
  });

  test('scheduleTask runs after delay', () => {
    const mockFn = jest.fn();

    scheduleTask(mockFn, 1000);

    expect(mockFn).not.toHaveBeenCalled(); // not yet!

    jest.advanceTimersByTime(500);
    expect(mockFn).not.toHaveBeenCalled(); // still not

    jest.advanceTimersByTime(500); // total: 1000ms
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('jest.runAllTimers() — fires all pending timers', () => {
    const mockFn = jest.fn();

    scheduleTask(mockFn, 5000);

    jest.runAllTimers(); // runs ALL pending timers immediately

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('debounce only calls once after silence', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();          // call 1
    debouncedFn();          // call 2 — resets timer
    debouncedFn();          // call 3 — resets timer

    jest.advanceTimersByTime(299);
    expect(mockFn).not.toHaveBeenCalled(); // still waiting

    jest.advanceTimersByTime(1); // 300ms total
    expect(mockFn).toHaveBeenCalledTimes(1); // only once!
  });

  test('scheduleRepeating fires multiple times', () => {
    const mockFn = jest.fn();

    const cancel = scheduleRepeating(mockFn, 100);

    jest.advanceTimersByTime(350);
    expect(mockFn).toHaveBeenCalledTimes(3); // 100, 200, 300ms

    cancel();

    jest.advanceTimersByTime(200);
    expect(mockFn).toHaveBeenCalledTimes(3); // stopped at 3
  });
});

// ============================================
// 4. Testing retry logic
// ============================================
describe('retryOperation', () => {
  test('returns result on first success', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await retryOperation(mockFn, 3);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('retries on failure and succeeds eventually', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success on 3rd try');

    const result = await retryOperation(mockFn, 3);

    expect(result).toBe('success on 3rd try');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('throws after max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(retryOperation(mockFn, 3)).rejects.toThrow('always fails');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});
