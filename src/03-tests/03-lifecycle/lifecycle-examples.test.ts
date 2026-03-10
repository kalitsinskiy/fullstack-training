import { InMemoryDatabase } from './database';

// ============================================
// LIFECYCLE HOOKS — Jest reference
// ============================================

// ============================================
// beforeEach / afterEach — runs around EACH test
// ============================================
describe('beforeEach / afterEach basics', () => {
  let db: InMemoryDatabase<{ id: string; name: string }>;

  // Runs BEFORE each test in this describe block
  beforeEach(() => {
    db = new InMemoryDatabase();
    // Fresh database for every test — tests don't affect each other
  });

  // Runs AFTER each test — good for cleanup, closing connections
  afterEach(() => {
    db.clear();
    // Optional here since we create a new db in beforeEach anyway
    // But useful for things like: jest.restoreAllMocks(), server.close()
  });

  test('insert adds an item', () => {
    db.insert({ id: '1', name: 'Alice' });
    expect(db.count()).toBe(1);
  });

  test('starts fresh — previous test data is gone', () => {
    // This test runs with a NEW db from beforeEach
    // The item from the previous test is NOT here
    expect(db.count()).toBe(0);
  });

  test('can insert multiple items', () => {
    db.insert({ id: '1', name: 'Alice' });
    db.insert({ id: '2', name: 'Bob' });
    expect(db.count()).toBe(2);
    expect(db.findById('1')).toEqual({ id: '1', name: 'Alice' });
  });
});

// ============================================
// beforeAll / afterAll — runs ONCE for the whole describe
// ============================================
describe('beforeAll / afterAll', () => {
  let db: InMemoryDatabase<{ id: string; value: number }>;
  const callOrder: string[] = [];

  // Runs ONCE before all tests in this describe
  beforeAll(() => {
    db = new InMemoryDatabase();
    callOrder.push('beforeAll');
    // Good for: creating DB connection, starting server, loading fixtures
    db.insert({ id: 'seed-1', value: 100 });
    db.insert({ id: 'seed-2', value: 200 });
  });

  // Runs ONCE after all tests
  afterAll(() => {
    callOrder.push('afterAll');
    db.clear();
    // Good for: closing connections, removing temp files
  });

  beforeEach(() => {
    callOrder.push('beforeEach');
  });

  afterEach(() => {
    callOrder.push('afterEach');
  });

  test('seeded data is available', () => {
    callOrder.push('test:seeded');
    expect(db.count()).toBe(2);
    expect(db.findById('seed-1')).toEqual({ id: 'seed-1', value: 100 });
  });

  test('data persists between tests (shared db)', () => {
    callOrder.push('test:persists');
    // Unlike beforeEach pattern, data from beforeAll persists
    expect(db.count()).toBe(2);
  });

  test('execution order is correct', () => {
    // beforeAll → beforeEach → test → afterEach → beforeEach → test → afterEach → afterAll
    expect(callOrder).toEqual([
      'beforeAll',
      'beforeEach', 'test:seeded', 'afterEach',
      'beforeEach', 'test:persists', 'afterEach',
      'beforeEach', // for this test
    ]);
  });
});

// ============================================
// Nested describe — scoped lifecycle hooks
// ============================================
describe('Nested describe blocks', () => {
  let db: InMemoryDatabase<{ id: string; role: string }>;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  describe('admin operations', () => {
    // This beforeEach runs IN ADDITION to the outer beforeEach
    // Outer runs first, then inner
    beforeEach(() => {
      db.insert({ id: 'admin-1', role: 'admin' });
    });

    test('admin user exists', () => {
      expect(db.findById('admin-1')).toEqual({ id: 'admin-1', role: 'admin' });
    });

    test('can delete admin', () => {
      const deleted = db.delete('admin-1');
      expect(deleted).toBe(true);
      expect(db.count()).toBe(0);
    });
  });

  describe('regular user operations', () => {
    beforeEach(() => {
      db.insert({ id: 'user-1', role: 'user' });
    });

    test('regular user exists (no admin from other describe)', () => {
      // admin-1 was NOT inserted here — different describe scope
      expect(db.count()).toBe(1);
      expect(db.findById('user-1')).toBeDefined();
      expect(db.findById('admin-1')).toBeUndefined();
    });
  });

  test('outer test — only outer beforeEach ran', () => {
    expect(db.count()).toBe(0); // neither admin nor user was seeded
  });
});

// ============================================
// Why test isolation matters
// ============================================
describe('Test isolation — why it matters', () => {
  // BAD PATTERN: shared mutable state without beforeEach
  let sharedDb: InMemoryDatabase<{ id: string }>;

  // PROBLEM: this runs ONCE, not before each test
  beforeAll(() => {
    sharedDb = new InMemoryDatabase();
  });

  test('first test mutates shared state', () => {
    sharedDb.insert({ id: '1' });
    expect(sharedDb.count()).toBe(1);
  });

  test('second test is affected by first test', () => {
    // The item from the previous test is still here!
    // This test's result depends on test execution ORDER — fragile!
    expect(sharedDb.count()).toBe(1); // would be 0 if tests ran in isolation
  });

  // Lesson: use beforeEach to create fresh state for each test
  // Use beforeAll only for truly shared setup (connections, heavy fixtures)
});
