import { formatUser, formatApiError, generateReport, formatUserList } from './formatter';
import type { User, ApiError, ReportRow } from './formatter';

// ============================================
// SNAPSHOTS — Jest reference
// ============================================

const testUser: User = {
  id: 'u-123',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'admin',
  createdAt: new Date('2024-01-15'),
};

// ============================================
// toMatchSnapshot — stores to __snapshots__ file
// ============================================
describe('toMatchSnapshot', () => {
  test('formatUser output matches snapshot', () => {
    const result = formatUser(testUser);

    // First run: creates snapshot file and saves result
    // Subsequent runs: compares to saved snapshot
    expect(result).toMatchSnapshot();
  });

  test('formatApiError matches snapshot', () => {
    const error: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      statusCode: 400,
      details: ['name is required', 'email is invalid'],
    };

    // timestamp is dynamic — pass property matcher so snapshot stores "Any<String>"
    // instead of a specific timestamp that would break on every run
    expect(formatApiError(error)).toMatchSnapshot({
      timestamp: expect.any(String),
    });
  });

  test('generateReport matches snapshot', () => {
    const rows: ReportRow[] = [
      { label: 'Sales', value: 1500 },
      { label: 'Returns', value: 200 },
      { label: 'Region', value: 'North' },
    ];

    expect(generateReport('Monthly Report', rows)).toMatchSnapshot({
      summary: { generated: expect.any(String), rowCount: 3, total: 1700 },
    });
  });
});

// ============================================
// toMatchInlineSnapshot — snapshot inside the test file
// ============================================
describe('toMatchInlineSnapshot', () => {
  test('small objects — inline snapshot is readable', () => {
    const result = formatUser({
      id: 'u-1',
      name: 'Bob',
      email: 'bob@example.com',
      role: 'user',
      createdAt: new Date('2024-06-01'),
    });

    // Inline snapshot: the expected value is right here in the code
    // Jest auto-fills it on first run
    expect(result).toMatchInlineSnapshot(`
      {
        "accessLevel": "user",
        "contactEmail": "bob@example.com",
        "displayName": "Bob",
        "id": "u-1",
        "isAdmin": false,
        "memberSince": "2024-06-01",
      }
    `);
  });

  test('error without details — stable fields only', () => {
    const error: ApiError = {
      code: 'NOT_FOUND',
      message: 'Resource not found',
      statusCode: 404,
    };

    // For inline snapshots with dynamic data — destructure and snapshot only stable part
    const { timestamp, ...stable } = formatApiError(error) as Record<string, unknown>;

    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // valid ISO string
    expect(stable).toMatchInlineSnapshot(`
      {
        "documentation": "https://docs.example.com/errors/NOT_FOUND",
        "error": {
          "code": "NOT_FOUND",
          "httpStatus": 404,
          "message": "Resource not found",
        },
      }
    `);
  });
});

// ============================================
// WHEN to use snapshots
// ============================================
describe('When to use snapshots — good cases', () => {
  // ✅ Complex object with many fields — snapshot is much cleaner than toEqual
  test('user list format — snapshot is cleaner than toEqual for complex shape', () => {
    const users: User[] = [
      { id: '1', name: 'Alice', email: 'a@a.com', role: 'admin', createdAt: new Date('2024-01-01') },
      { id: '2', name: 'Bob', email: 'b@b.com', role: 'user', createdAt: new Date('2024-02-01') },
    ];

    // The snapshot documents the ENTIRE shape — great for regression testing
    expect(formatUserList(users)).toMatchSnapshot();
  });

  // ✅ After a refactor — quickly verify output didn't change
  // ✅ API response serialization — verify the JSON shape
});

// ============================================
// WHEN NOT to use snapshots
// ============================================
describe('When NOT to use snapshots', () => {
  // ❌ BAD: simple values — use toBe
  test('simple value — use toBe instead of snapshot', () => {
    // Bad: expect(2 + 2).toMatchSnapshot()
    expect(2 + 2).toBe(4); // ✅ much clearer intent
  });

  // ❌ BAD: dynamic data without stabilizing
  test('dynamic data problem — timestamps change every run', () => {
    // This would FAIL on every run because Date.now() changes:
    // const result = { id: 1, createdAt: new Date() };
    // expect(result).toMatchSnapshot(); // ❌ fails every time!

    // Fix: use expect.any(Number) or fix the value
    const result = { id: 1, createdAt: Date.now() };
    expect(result).toMatchObject({
      id: 1,
      createdAt: expect.any(Number), // ✅ flexible
    });
  });

  // ❌ BAD: snapshot too large — nobody reviews it
  // Rule of thumb: if snapshot > ~30 lines, it's probably not being reviewed
  // Prefer targeted toMatchObject + toHaveProperty for large objects

  // ❌ BAD: testing implementation details
  // Snapshot tests can make refactoring painful if they capture internal structure
  // They should capture the PUBLIC interface / output shape
});

// ============================================
// Updating snapshots
// ============================================
// When you intentionally change a formatter:
//   npx jest --updateSnapshot   (or -u flag)
//   npx jest --updateSnapshot src/03-tests/05-snapshots
//
// Only do this when you INTENDED to change the output.
// Review snapshot diff in git before committing!
