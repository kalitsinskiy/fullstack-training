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
  });

  test('fetchUsers returns 2 users', async () => {
    // TODO: await fetchUsers()
    // TODO: verify length is 2
    // TODO: verify the second user's name is 'Bob'
  });
});

// Exercise 2: Testing rejections
describe('Exercise 2: Rejections', () => {
  test('fetchUser with empty id throws', async () => {
    // TODO: use rejects.toThrow to verify it throws 'ID is required'
  });

  test('fetchUser with not-found id throws', async () => {
    // TODO: use rejects.toThrow to verify 'User not found'
  });

  test('fetchUser resolves correctly with resolves matcher', async () => {
    // TODO: use .resolves.toMatchObject to verify user with id '99'
    //       without awaiting directly
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

    // TODO: advance time by 1 more ms (total: 2000ms)
    // TODO: verify mockFn was called exactly once
  });

  test('debounce fires only once after rapid calls', () => {
    const mockFn = jest.fn();
    const debounced = debounce(mockFn, 500);

    // TODO: call debounced() 5 times rapidly
    // TODO: advance time by 499ms — verify NOT called
    // TODO: advance time by 1ms more — verify called exactly once
  });
});

// Exercise 4: Mock async functions
describe('Exercise 4: Mock async dependencies', () => {
  test('retryOperation retries on failure', async () => {
    // TODO: create a mockFn that rejects twice, then resolves with 'ok'
    // TODO: call retryOperation(mockFn, 3)
    // TODO: verify result is 'ok'
    // TODO: verify mockFn was called 3 times
  });

  test('retryOperation gives up after max attempts', async () => {
    // TODO: create a mockFn that always rejects with Error('permanently broken')
    // TODO: verify retryOperation(mockFn, 2) rejects with 'permanently broken'
    // TODO: verify mockFn was called exactly 2 times
  });
});
