/* eslint-disable @typescript-eslint/no-unused-vars */
import { formatUser, formatApiError, generateReport } from './formatter';
import type { User, ApiError, ReportRow } from './formatter';

// ============================================
// EXERCISES — Snapshots
// ============================================

// Exercise 1: Your first snapshot
describe('Exercise 1: Basic snapshot', () => {
  test('formatUser matches snapshot', () => {
    const user: User = {
      id: 'test-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date('2024-03-01'),
    };

    // TODO: call formatUser(user) and use toMatchSnapshot()
    // Run the test once to create the snapshot
    // Then run again — it should pass
    expect(formatUser(user)).toMatchSnapshot();
  });

  test('formatApiError matches snapshot', () => {
    const error: ApiError = {
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
      statusCode: 401,
    };

    // TODO: call formatApiError(error) and use toMatchSnapshot()
    expect(formatApiError(error)).toMatchSnapshot({
      timestamp: expect.any(String),
    });
  });
});

// Exercise 2: Named snapshot
describe('Exercise 2: Named snapshot', () => {
  test('simple report snapshot', () => {
    // TODO: create rows: ReportRow[] with two entries (e.g. Revenue 5000, Costs 3000)
    // then call generateReport('Q1 Report', rows)
    // and use toMatchSnapshot('Q1 report shape') — give it a name
    // Run once to create, run again to verify
    // Note: toMatchInlineSnapshot() (auto-fills inline) is shown in the examples file
    // but requires an older Prettier version to work automatically
    const rows: ReportRow[] = [
      { label: 'Revenue', value: 5000 },
      { label: 'Costs', value: 3000 },
    ];

    expect(generateReport('Q1 Report', rows)).toMatchSnapshot(
      {
        summary: {
          generated: expect.any(String),
          rowCount: 2,
          total: 8000,
        },
      },
      'Q1 report shape'
    );
  });
});

// Exercise 3: When NOT to use snapshots
describe('Exercise 3: Know when NOT to use snapshots', () => {
  test('use toBe for simple numeric result', () => {
    const rows: ReportRow[] = [
      { label: 'A', value: 100 },
      { label: 'B', value: 200 },
    ];
    const report = generateReport('Test', rows) as { summary: { total: number } };

    // TODO: instead of snapshot, use toBe to check report.summary.total === 300
    // Why? A snapshot for a single number is overkill
    expect(report.summary.total).toBe(300);
  });

  test('use toMatchObject for partial shape validation', () => {
    const user: User = {
      id: 'x',
      name: 'Charlie',
      email: 'charlie@example.com',
      role: 'guest',
      createdAt: new Date(), // dynamic — changes every run!
    };

    const formatted = formatUser(user) as Record<string, unknown>;

    // TODO: use toMatchObject (NOT snapshot) to verify:
    //   - displayName is 'Charlie'
    //   - accessLevel is 'guest'
    //   - isAdmin is false
    // Why? Because memberSince is derived from createdAt which is dynamic
    expect(formatted).toMatchObject({
      displayName: 'Charlie',
      accessLevel: 'guest',
      isAdmin: false,
    });
  });
});

// Exercise 4: Updating a snapshot
describe('Exercise 4: Snapshot update workflow', () => {
  test('admin user snapshot', () => {
    const adminUser: User = {
      id: 'admin-1',
      name: 'Super Admin',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date('2020-01-01'),
    };

    // TODO: create a snapshot for formatUser(adminUser)
    // After you run it once and it passes, try this:
    // 1. Change the formatter to add a new field, e.g., prefix: 'ADMIN:'
    // 2. Run the test — it should FAIL (snapshot mismatch)
    // 3. Review the diff in the output
    // 4. Run: npx jest --updateSnapshot to update it
    // This is the snapshot update workflow
    expect(formatUser(adminUser)).toMatchSnapshot();
  });
});
