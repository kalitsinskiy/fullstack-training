/* eslint-disable @typescript-eslint/no-unused-vars */
import { InMemoryDatabase } from './database';

// ============================================
// EXERCISES — Lifecycle hooks
// ============================================

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

// Exercise 1: beforeEach for isolation
describe('Exercise 1: beforeEach isolation', () => {
  let db: InMemoryDatabase<Product>;

  // TODO: create a fresh InMemoryDatabase before each test
  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  test('can insert a product', () => {
    // TODO: insert { id: 'p1', name: 'Laptop', price: 999, inStock: true }
    db.insert({ id: 'p1', name: 'Laptop', price: 999, inStock: true });

    // TODO: verify db.count() is 1
    expect(db.count()).toBe(1);

    // TODO: verify findById('p1').name is 'Laptop'
    expect(db.findById('p1')?.name).toBe('Laptop');
  });

  test('database is fresh for each test', () => {
    // TODO: verify db.count() is 0 (previous test's data should not be here)
    expect(db.count()).toBe(0);
  });

  test('update changes only specified fields', () => {
    // TODO: insert a product with inStock: true
    db.insert({ id: 'p1', name: 'Laptop', price: 999, inStock: true });

    // TODO: update it with { inStock: false }
    db.update('p1', { inStock: false });

    // TODO: verify name is unchanged, inStock is now false
    expect(db.findById('p1')?.name).toBe('Laptop');
    expect(db.findById('p1')?.inStock).toBeFalsy();
  });
});

// Exercise 2: beforeAll for shared expensive setup
describe('Exercise 2: beforeAll for shared data', () => {
  let db: InMemoryDatabase<Product>;

  // TODO: use beforeAll to create a db and insert 3 products ONCE
  //       Products: { id: 'p1', name: 'Laptop', price: 999, inStock: true }
  //                 { id: 'p2', name: 'Phone', price: 699, inStock: false }
  //                 { id: 'p3', name: 'Tablet', price: 449, inStock: true }
  // TODO: use afterAll to call db.clear()

  beforeAll(() => {
    db = new InMemoryDatabase();
    db.insert({ id: 'p1', name: 'Laptop', price: 999, inStock: true });
    db.insert({ id: 'p2', name: 'Phone', price: 699, inStock: false });
    db.insert({ id: 'p3', name: 'Tablet', price: 449, inStock: true });
  });

  afterAll(() => {
    db.clear();
  });

  test('all 3 products were seeded', () => {
    // TODO: verify db.count() is 3
    expect(db.count()).toBe(3);
  });

  test('can find phone by id', () => {
    // TODO: verify findById('p2').name is 'Phone'
    expect(db.findById('p2')?.name).toBe('Phone');
  });

  test('data persists from first test', () => {
    // TODO: verify db.count() is still 3 (shared db, not recreated)
    expect(db.count()).toBe(3);
  });
});

// Exercise 3: Nested describe with scoped setup
describe('Exercise 3: Nested describe', () => {
  let db: InMemoryDatabase<{ id: string; type: string; active: boolean }>;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  describe('active items', () => {
    // TODO: add a beforeEach that inserts { id: 'a1', type: 'A', active: true }
    beforeEach(() => {
      db.insert({ id: 'a1', type: 'A', active: true });
    });

    test('active item exists', () => {
      // TODO: verify findById('a1') is defined and active is true
      const item = db.findById('a1');
      expect(item).toBeDefined();
      expect(item?.active).toBe(true);
    });

    test('can deactivate', () => {
      // TODO: update 'a1' with { active: false }
      db.update('a1', { active: false });

      // TODO: verify it is now inactive
      expect(db.findById('a1')?.active).toBe(false);
    });
  });

  describe('inactive items', () => {
    beforeEach(() => {
      db.insert({ id: 'i1', type: 'B', active: false });
    });

    test('inactive item exists, active item does NOT', () => {
      // TODO: verify findById('i1') exists
      expect(db.findById('i1')).toBeDefined();

      // TODO: verify findById('a1') is undefined (not inserted in this describe)
      expect(db.findById('a1')).toBeUndefined();
    });
  });
});

// Exercise 4: afterEach with spies
describe('Exercise 4: afterEach cleanup with spies', () => {
  let consoleSpy: jest.SpyInstance;

  // TODO: in beforeEach, spy on console.warn and suppress it
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // TODO: in afterEach, restore the spy
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('operation log records operations', () => {
    const db = new InMemoryDatabase<{ id: string }>();
    db.insert({ id: '1' });
    db.insert({ id: '2' });
    db.delete('1');

    // TODO: verify operationLog contains ['INSERT:1', 'INSERT:2', 'DELETE:1']
    expect(db.operationLog).toEqual(['INSERT:1', 'INSERT:2', 'DELETE:1']);
  });

  test('spy works in second test too (restored and recreated)', () => {
    // TODO: call console.warn('test warning')
    console.warn('test warning');

    // TODO: verify consoleSpy was called with 'test warning'
    expect(consoleSpy).toHaveBeenCalledWith('test warning');
  });
});
