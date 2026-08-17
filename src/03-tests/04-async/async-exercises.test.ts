/* eslint-disable @typescript-eslint/no-unused-vars */
import { fetchUser, fetchUsers, retryOperation, debounce, scheduleTask } from './api';

// ============================================
// EXERCISES — Async testing
// ============================================

// Exercise 1: Basic async/await
describe('Exercise 1: async/await', () => {
  test('fetchUser returns correct data', async () => {
    // TODO: await fetchUser('abc')
    // TODO: verify the result has id: 'abc', name: 'User abc', email: 'abc@example.com'
    const user = await fetchUser('abc');

    expect(user).toEqual({
      id: 'abc',
      name: 'User abc',
      email: 'abc@example.com',
    });
  });

  test('fetchUsers returns 2 users', async () => {
    // TODO: await fetchUsers()
    // TODO: verify length is 2
    // TODO: verify the second user's name is 'Bob'
    const users = await fetchUsers();

    expect(users).toHaveLength(2);
    expect(users[1].name).toBe('Bob');
  });
});

// Exercise 2: Testing rejections
describe('Exercise 2: Rejections', () => {
  test('fetchUser with empty id throws', async () => {
    // TODO: use rejects.toThrow to verify it throws 'ID is required'
    await expect(fetchUser('')).rejects.toThrow('ID is required');
  });

  test('fetchUser with not-found id throws', async () => {
    // TODO: use rejects.toThrow to verify 'User not found'
    await expect(fetchUser('not-found')).rejects.toThrow('User not found');
  });

  test('fetchUser resolves correctly with resolves matcher', async () => {
    // TODO: use .resolves.toMatchObject to verify user with id '99'
    //       without awaiting directly
    await expect(fetchUser('99')).resolves.toMatchObject({
      id: '99',
      name: 'User 99',
      email: '99@example.com',
    });
  });
});

// Exercise 3: Fake timers
describe('Exercise 3: Fake timers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('scheduleTask does not run before delay', () => {
    const mockFn = jest.fn();
    scheduleTask(mockFn, 2000);

    // TODO: advance time by 1999ms
    // TODO: verify mockFn was NOT called
    jest.advanceTimersByTime(1999);
    expect(mockFn).not.toHaveBeenCalled();

    // TODO: advance time by 1 more ms (total: 2000ms)
    // TODO: verify mockFn was called exactly once
    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('debounce fires only once after rapid calls', () => {
    const mockFn = jest.fn();
    const debounced = debounce(mockFn, 500);

    // TODO: call debounced() 5 times rapidly
    // TODO: advance time by 499ms — verify NOT called
    // TODO: advance time by 1ms more — verify called exactly once
    debounced();
    debounced();
    debounced();
    debounced();
    debounced();

    jest.advanceTimersByTime(499);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

// Exercise 4: Mock async functions
describe('Exercise 4: Mock async dependencies', () => {
  test('retryOperation retries on failure', async () => {
    // TODO: create a mockFn that rejects twice, then resolves with 'ok'
    // TODO: call retryOperation(mockFn, 3)
    // TODO: verify result is 'ok'
    // TODO: verify mockFn was called 3 times
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValue('ok');

    const result = await retryOperation(mockFn, 3);

    expect(result).toBe('ok');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('retryOperation gives up after max attempts', async () => {
    // TODO: create a mockFn that always rejects with Error('permanently broken')
    // TODO: verify retryOperation(mockFn, 2) rejects with 'permanently broken'
    // TODO: verify mockFn was called exactly 2 times
    const mockFn = jest.fn().mockRejectedValue(new Error('permanently broken'));

    await expect(retryOperation(mockFn, 2)).rejects.toThrow('permanently broken');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
