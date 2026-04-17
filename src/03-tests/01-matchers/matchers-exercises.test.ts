/* eslint-disable @typescript-eslint/no-unused-vars */
import { hasUncaughtExceptionCaptureCallback } from 'process';
import {
  add,
  subtract,
  multiply,
  divide,
  factorial,
  isPrime,
  clamp,
  sum,
  createUser,
} from './calculator';

// ============================================
// EXERCISES — complete each TODO
// ============================================

// Exercise 1: Basic matchers
describe('Exercise 1: Basic matchers', () => {
  test('multiply returns correct product', () => {
    // TODO: test that multiply(3, 4) returns 12
    // TODO: test that multiply(0, 100) returns 0
    // TODO: test that multiply(-2, 5) returns -10
    expect(multiply(3, 4)).toBe(12);
    expect(multiply(0, 100)).toBe(0);
    expect(multiply(-2, 5)).toBe(-10);
  });

  test('subtract returns correct difference', () => {
    // TODO: test subtract(10, 3) === 7
    // TODO: test subtract(0, 5) === -5
    expect(subtract(10, 3)).toBe(7);
    expect(subtract(0, 5)).toBe(-5);
  });
});

// Exercise 2: Truthiness
describe('Exercise 2: Truthiness', () => {
  test('isPrime correctly identifies primes', () => {
    // TODO: test that 2, 3, 5, 7, 11, 13 are prime (use toBe(true))
    // TODO: test that 0, 1, 4, 6, 8, 9 are NOT prime
    const shouldBePrime = [2, 3, 5, 7, 11, 13];
    const shouldBeNotPrime = [0, 1, 4, 6, 8, 9];

    for (const i of shouldBePrime) {
      expect(isPrime(i)).toBe(true);
    }

    for (const i of shouldBeNotPrime) {
      expect(isPrime(i)).toBe(false);
    }
  });

  test('sum of empty array', () => {
    // TODO: verify sum([]) returns 0
    // TODO: verify 0 is falsy using toBeFalsy()
    expect(sum([])).toBeFalsy();
  });
});

// Exercise 3: Number matchers
describe('Exercise 3: Numbers and clamp', () => {
  test('clamp works correctly', () => {
    // TODO: test 5 values — below min, at min, in range, at max, above max
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(10, 0, 10)).toBe(10);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test('factorial grows fast', () => {
    // TODO: verify factorial(10) is greater than 3_000_000 (toBeGreaterThan)
    // TODO: verify factorial(5) is less than 200 (toBeLessThan)
    expect(factorial(10)).toBeGreaterThan(3000000);
    expect(factorial(5)).toBeLessThan(200);
  });

  test('floating point comparison', () => {
    // TODO: show that add(0.1, 0.2) is NOT exactly 0.3 with not.toBe
    // TODO: then verify it IS close to 0.3 with toBeCloseTo
    expect(add(0.1, 0.2)).not.toBe(0.3);
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
  });
});

// Exercise 4: Objects and arrays
describe('Exercise 4: Objects and arrays', () => {
  test('createUser returns user with correct shape', () => {
    const user = createUser(42, 'Bob', 'bob@example.com');
    // TODO: use toEqual to check the full object
    // TODO: use toHaveProperty to check 'role' equals 'user'
    // TODO: use toMatchObject to check only id and name (partial match)
    expect(user).toEqual({
      id: 42,
      name: 'Bob',
      email: 'bob@example.com',
      role: 'user',
    });
    expect(user).toHaveProperty('role', 'user');
    expect(user).toMatchObject({ id: 42, name: 'Bob' });
  });

  test('array of users contains specific user', () => {
    const users = [
      createUser(1, 'Alice', 'alice@example.com'),
      createUser(2, 'Bob', 'bob@example.com'),
    ];
    // TODO: verify users array has length 2
    // TODO: use toContainEqual to find Bob
    expect(users).toHaveLength(2);
    expect(users).toContainEqual(createUser(2, 'Bob', 'bob@example.com'));
  });
});

// Exercise 5: Error testing
describe('Exercise 5: Error testing', () => {
  test('divide throws on division by zero', () => {
    // TODO: verify divide(10, 0) throws
    // TODO: verify the error message contains 'zero'
    // TODO: verify divide(10, 2) does NOT throw
    expect(() => divide(10, 0)).toThrow();
    expect(() => divide(10, 0)).toThrow('zero');
    expect(() => divide(10, 2)).not.toThrow();
  });

  test('factorial throws for negative input', () => {
    // TODO: verify factorial(-5) throws RangeError
    // TODO: verify factorial(0) does NOT throw and returns 1
    expect(() => factorial(-5)).toThrow(RangeError);
    expect(() => factorial(0)).not.toThrow();
    expect(factorial(0)).toBe(1);
  });
});

// Exercise 6: expect.any() and toMatchObject
describe('Exercise 6: Flexible matchers', () => {
  test('API response shape', () => {
    const response = {
      status: 201,
      data: createUser(1, 'Alice', 'alice@example.com'),
      timestamp: Date.now(),
      requestId: 'req-abc-123',
    };
    // TODO: use toMatchObject with expect.any(Number) for timestamp
    //       and expect.any(String) for requestId
    expect(response).toMatchObject({
      status: 201,
      data: createUser(1, 'Alice', 'alice@example.com'),
      timestamp: expect.any(Number),
      requestId: expect.any(String),
    });
  });
});
