import {
  add,
  divide,
  factorial,
  isPrime,
  clamp,
  sum,
  createUser,
  getUserNames,
} from './calculator';

// ============================================
// JEST MATCHERS — complete reference with examples
// ============================================

// ============================================
// toBe — strict equality (===), for primitives
// ============================================
describe('toBe — strict equality', () => {
  test('2 + 2 equals 4', () => {
    expect(add(2, 2)).toBe(4);
  });

  test('string equality', () => {
    expect('hello').toBe('hello');
  });

  test('boolean', () => {
    expect(isPrime(7)).toBe(true);
    expect(isPrime(4)).toBe(false);
  });

  // ❌ toBe FAILS for objects — compares reference, not value
  test('toBe fails for objects with same shape', () => {
    const a = { x: 1 };
    const b = { x: 1 };
    expect(a).not.toBe(b); // different references!
  });
});

// ============================================
// toEqual — deep equality, for objects and arrays
// ============================================
describe('toEqual — deep equality', () => {
  test('objects with same shape are equal', () => {
    const user = createUser(1, 'Alice', 'alice@example.com');
    expect(user).toEqual({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'user',
    });
  });

  test('arrays are compared element by element', () => {
    expect(
      getUserNames([
        { id: 1, name: 'Alice', email: 'a@a.com' },
        { id: 2, name: 'Bob', email: 'b@b.com' },
      ])
    ).toEqual(['Alice', 'Bob']);
  });

  // toEqual ignores undefined properties, toStrictEqual does not
  test('toStrictEqual is stricter than toEqual', () => {
    expect({ a: 1, b: undefined }).toEqual({ a: 1 }); // passes
    expect({ a: 1, b: undefined }).not.toStrictEqual({ a: 1 }); // b: undefined matters
  });
});

// ============================================
// Truthiness matchers
// ============================================
describe('Truthiness', () => {
  test('toBeNull', () => {
    expect(null).toBeNull();
    expect(undefined).not.toBeNull();
  });

  test('toBeUndefined / toBeDefined', () => {
    const notSet: number | undefined = undefined;
    expect(notSet).toBeUndefined();

    const isSet: number | undefined = 5;
    expect(isSet).toBeDefined();
  });

  test('toBeTruthy / toBeFalsy', () => {
    expect(1).toBeTruthy();
    expect('hello').toBeTruthy();
    expect([]).toBeTruthy(); // empty array is truthy!
    expect({}).toBeTruthy(); // empty object is truthy!

    expect(0).toBeFalsy();
    expect('').toBeFalsy();
    expect(null).toBeFalsy();
    expect(undefined).toBeFalsy();
    expect(false).toBeFalsy();
  });
});

// ============================================
// Number matchers
// ============================================
describe('Numbers', () => {
  test('comparison', () => {
    expect(10).toBeGreaterThan(5);
    expect(5).toBeLessThan(10);
    expect(10).toBeGreaterThanOrEqual(10);
    expect(5).toBeLessThanOrEqual(5);
  });

  test('clamp keeps value in range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  // Floating point — never use toBe for 0.1 + 0.2
  test('floating point — use toBeCloseTo', () => {
    expect(0.1 + 0.2).not.toBe(0.3); // 0.30000000000000004
    expect(0.1 + 0.2).toBeCloseTo(0.3); // passes
    expect(0.1 + 0.2).toBeCloseTo(0.3, 5); // 5 decimal places
  });
});

// ============================================
// String matchers
// ============================================
describe('Strings', () => {
  test('toContain — substring check', () => {
    expect('hello world').toContain('world');
    expect('alice@example.com').toContain('@');
  });

  test('toMatch — regex', () => {
    expect('alice@example.com').toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect('Error: something went wrong').toMatch(/^Error:/);
  });

  test('toHaveLength', () => {
    expect('hello').toHaveLength(5);
  });
});

// ============================================
// Array matchers
// ============================================
describe('Arrays', () => {
  test('toContain — element check', () => {
    expect([1, 2, 3]).toContain(2);
    expect(['a', 'b', 'c']).toContain('b');
  });

  test('toHaveLength', () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect([]).toHaveLength(0);
  });

  test('toContainEqual — deep element check', () => {
    const users = [createUser(1, 'Alice', 'a@a.com'), createUser(2, 'Bob', 'b@b.com')];
    expect(users).toContainEqual({ id: 1, name: 'Alice', email: 'a@a.com', role: 'user' });
  });
});

// ============================================
// Object matchers
// ============================================
describe('Objects', () => {
  test('toMatchObject — partial match', () => {
    const user = createUser(1, 'Alice', 'alice@example.com');
    expect(user).toMatchObject({ id: 1, name: 'Alice' });
  });

  test('toHaveProperty', () => {
    const user = createUser(1, 'Alice', 'alice@example.com');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('role', 'user');
    expect(user).toHaveProperty('id', 1);
  });

  test('expect.any() — type flexibility', () => {
    const user = createUser(1, 'Alice', 'alice@example.com');
    expect(user).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
    });
  });

  test('expect.objectContaining', () => {
    const response = { status: 200, body: { id: 1, name: 'Alice' }, timestamp: Date.now() };
    expect(response).toMatchObject({
      status: 200,
      body: expect.objectContaining({ name: 'Alice' }),
      timestamp: expect.any(Number),
    });
  });
});

// ============================================
// Error matchers — toThrow
// ============================================
describe('Errors — toThrow', () => {
  test('throws when dividing by zero', () => {
    // Must wrap in arrow function — toThrow catches the thrown error
    expect(() => divide(1, 0)).toThrow();
    expect(() => divide(1, 0)).toThrow('Division by zero');
    expect(() => divide(1, 0)).toThrow(Error);
    expect(() => divide(1, 0)).toThrow(/[Dd]ivision/);
  });

  test('throws RangeError for negative factorial', () => {
    expect(() => factorial(-1)).toThrow(RangeError);
    expect(() => factorial(-1)).toThrow('Factorial of negative number');
  });

  test('does NOT throw for valid input', () => {
    expect(() => divide(10, 2)).not.toThrow();
    expect(() => factorial(5)).not.toThrow();
  });
});

// ============================================
// .not — negate any matcher
// ============================================
describe('.not modifier', () => {
  test('invert expectations', () => {
    expect(add(1, 1)).not.toBe(3);
    expect([1, 2, 3]).not.toContain(5);
    expect(isPrime(1)).not.toBe(true);
    expect({}).not.toBeNull();
    expect(sum([])).not.toBeUndefined();
  });
});
