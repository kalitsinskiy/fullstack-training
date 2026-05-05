export {};
// ============================================
// Exercise: Pagination
// ============================================
// Run: npx ts-node src/04-backend/lessons/09-api-design-and-security/exercises/pagination-exercise.ts

// --- Types ---

interface PaginationQuery {
  page?: number;
  limit?: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface Task {
  id: number;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  createdAt: Date;
}

// --- Simulated database ---

const tasks: Task[] = [
  { id: 1, title: 'Set up project', status: 'done', priority: 'high', assignee: 'Alice', createdAt: new Date('2025-01-01') },
  { id: 2, title: 'Design database schema', status: 'done', priority: 'high', assignee: 'Bob', createdAt: new Date('2025-01-02') },
  { id: 3, title: 'Implement auth module', status: 'in-progress', priority: 'high', assignee: 'Alice', createdAt: new Date('2025-01-03') },
  { id: 4, title: 'Create room endpoints', status: 'in-progress', priority: 'medium', assignee: 'Carol', createdAt: new Date('2025-01-04') },
  { id: 5, title: 'Write unit tests', status: 'todo', priority: 'medium', assignee: 'Bob', createdAt: new Date('2025-01-05') },
  { id: 6, title: 'Add Swagger docs', status: 'todo', priority: 'low', assignee: 'Alice', createdAt: new Date('2025-01-06') },
  { id: 7, title: 'Configure CORS', status: 'todo', priority: 'medium', assignee: 'Carol', createdAt: new Date('2025-01-07') },
  { id: 8, title: 'Set up rate limiting', status: 'todo', priority: 'low', assignee: 'Bob', createdAt: new Date('2025-01-08') },
  { id: 9, title: 'Add Helmet headers', status: 'todo', priority: 'low', assignee: 'Alice', createdAt: new Date('2025-01-09') },
  { id: 10, title: 'Deploy to staging', status: 'todo', priority: 'high', assignee: 'Carol', createdAt: new Date('2025-01-10') },
  { id: 11, title: 'Integration tests', status: 'todo', priority: 'medium', assignee: 'Bob', createdAt: new Date('2025-01-11') },
  { id: 12, title: 'Performance testing', status: 'todo', priority: 'low', assignee: 'Alice', createdAt: new Date('2025-01-12') },
  { id: 13, title: 'Fix login bug', status: 'in-progress', priority: 'high', assignee: 'Carol', createdAt: new Date('2025-01-13') },
  { id: 14, title: 'Add email notifications', status: 'todo', priority: 'medium', assignee: 'Bob', createdAt: new Date('2025-01-14') },
  { id: 15, title: 'Code review', status: 'todo', priority: 'medium', assignee: 'Alice', createdAt: new Date('2025-01-15') },
];

// ============================================
// TODO 1: Implement the paginate function
// ============================================
// Create a generic function that takes:
//   - items: T[] (the full array of items)
//   - query: PaginationQuery (page and limit from query params)
// And returns: PaginatedResponse<T>
//
// Requirements:
//   - page defaults to 1, minimum 1
//   - limit defaults to 10, minimum 1, maximum 100
//   - Calculate skip = (page - 1) * limit
//   - totalPages = Math.ceil(total / limit), minimum 1
//   - Return the correct slice of items + meta

function paginate<T>(_items: T[], _query: PaginationQuery): PaginatedResponse<T> {
  // TODO: Rename parameters (remove _ prefix) and implement this function
  throw new Error('Not implemented');
}

// ============================================
// TODO 2: Implement the filterAndPaginate function
// ============================================
// Create a function specifically for tasks that:
//   - Accepts optional filters: { status?, priority?, assignee? }
//   - Accepts PaginationQuery
//   - Filters the tasks array based on provided filters
//   - Paginates the filtered result using your paginate function
//   - Returns PaginatedResponse<Task>

interface TaskFilter {
  status?: Task['status'];
  priority?: Task['priority'];
  assignee?: string;
}

function filterAndPaginate(
  _filter: TaskFilter,
  _query: PaginationQuery,
): PaginatedResponse<Task> {
  // TODO: Rename parameters (remove _ prefix) and implement this function
  throw new Error('Not implemented');
}

// ============================================
// TODO 3: Implement cursor-based pagination
// ============================================
// Create a function that implements cursor-based pagination for tasks:
//   - cursor: the `id` of the last item from the previous page (undefined for first page)
//   - limit: number of items to return
// Return: { data: Task[], meta: { nextCursor: number | null, hasMore: boolean } }

interface CursorQuery {
  cursor?: number;
  limit?: number;
}

interface CursorResponse {
  data: Task[];
  meta: {
    nextCursor: number | null;
    hasMore: boolean;
  };
}

function paginateByCursor(_query: CursorQuery): CursorResponse {
  // TODO: Rename _query back to query and implement this function
  throw new Error('Not implemented');
}

// --- Tests ---

// Runs `fn`, prints result, and labels stub/error states clearly.
// `fn` returns the value to print; if it throws "Not implemented", we mark TODO.
function check<T>(label: string, fn: () => T, expected?: string): void {
  console.log(`\n--- ${label} ---`);
  if (expected) console.log(`Expected: ${expected}`);
  try {
    const result = fn();
    if (Array.isArray(result)) {
      console.log('Data:', result);
    } else {
      console.log('Result:', result);
    }
  } catch (err: any) {
    if (err?.message === 'Not implemented') {
      console.log('TODO: function not implemented yet');
    } else {
      console.log('FAIL:', err?.message);
    }
  }
}

function main(): void {
  console.log('=== Pagination Exercise ===');

  // paginate — show just meta + titles for compact output
  const summary = <T extends { title?: string }>(r: PaginatedResponse<T>) => ({
    titles: r.data.map((t) => t.title),
    meta: r.meta,
  });

  check(
    'paginate: page 1, limit 5',
    () => summary(paginate(tasks, { page: 1, limit: 5 })),
    '5 items, meta { total: 15, page: 1, limit: 5, totalPages: 3 }',
  );
  check(
    'paginate: page 3, limit 5',
    () => summary(paginate(tasks, { page: 3, limit: 5 })),
    '5 items, page 3',
  );
  check(
    'paginate: beyond last page',
    () => summary(paginate(tasks, { page: 10, limit: 5 })),
    'empty titles, totalPages still 3',
  );
  check(
    'paginate: defaults (no page/limit)',
    () => paginate(tasks, {}).meta,
    '{ total: 15, page: 1, limit: 10, totalPages: 2 }',
  );
  check(
    'paginate: clamped (page=-1, limit=999)',
    () => paginate(tasks, { page: -1, limit: 999 }).meta,
    'page=1, limit=100',
  );
  check(
    'paginate: empty array',
    () => paginate([], { page: 1, limit: 10 }).meta,
    'total=0, totalPages=1',
  );

  // filterAndPaginate
  check(
    'filterAndPaginate: high priority',
    () => summary(filterAndPaginate({ priority: 'high' }, { page: 1, limit: 10 })),
    '5 high-priority tasks',
  );
  check(
    "filterAndPaginate: Alice's todo tasks",
    () => summary(filterAndPaginate({ assignee: 'Alice', status: 'todo' }, { page: 1, limit: 5 })),
    'tasks where assignee=Alice AND status=todo',
  );

  // Cursor pagination — chained, so do it step-by-step inside one try/catch
  console.log('\n--- Cursor pagination ---');
  try {
    const batch1 = paginateByCursor({ limit: 5 });
    console.log('Batch 1 (first 5):', batch1.data.map((t) => t.title));
    console.log('Meta:', batch1.meta);

    const batch2 = paginateByCursor({ cursor: batch1.meta.nextCursor!, limit: 5 });
    console.log('Batch 2 (next 5):', batch2.data.map((t) => t.title));
    console.log('Meta:', batch2.meta);

    const batch3 = paginateByCursor({ cursor: batch2.meta.nextCursor!, limit: 5 });
    console.log('Batch 3 (last 5, hasMore=false):', batch3.data.map((t) => t.title));
    console.log('Meta:', batch3.meta);
  } catch (err: any) {
    if (err?.message === 'Not implemented') {
      console.log('TODO: paginateByCursor() not implemented yet');
    } else {
      console.log('FAIL:', err?.message);
    }
  }

  console.log('\nDone.');
}

main();
