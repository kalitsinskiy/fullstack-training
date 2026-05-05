export {};
// ============================================
// Pagination Helper
// ============================================
// Run: npx ts-node src/04-backend/lessons/09-api-design-and-security/examples/pagination.ts

// --- 1. Pagination types ---

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

// --- 2. Offset-based pagination helper ---

function parsePagination(query: PaginationQuery): { page: number; limit: number; skip: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      // Clamp to >= 1 so an empty result still reports totalPages=1
      // (matches README + exercise expectations).
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

// --- 3. Simulate a database with in-memory data ---

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const categories = ['electronics', 'books', 'clothing', 'food'] as const;
const products: Product[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.round(Math.random() * 10000) / 100,
  category: categories[i % 4]!,
}));

function findProducts(
  filter: Partial<Product>,
  pagination: PaginationQuery,
): PaginatedResponse<Product> {
  // Filter
  let filtered = products;
  if (filter.category) {
    filtered = filtered.filter((p) => p.category === filter.category);
  }

  // Paginate
  const { page, limit, skip } = parsePagination(pagination);
  const total = filtered.length;
  const data = filtered.slice(skip, skip + limit);

  return buildPaginatedResponse(data, total, page, limit);
}

// --- 4. Cursor-based pagination ---

interface CursorQuery {
  cursor?: string;   // last item's ID or encoded value
  limit?: number;
}

interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

function findProductsByCursor(
  filter: Partial<Product>,
  query: CursorQuery,
): CursorPaginatedResponse<Product> {
  let filtered = products;
  if (filter.category) {
    filtered = filtered.filter((p) => p.category === filter.category);
  }

  const limit = Math.min(100, Math.max(1, query.limit || 10));

  // Find start position from cursor
  let startIndex = 0;
  if (query.cursor) {
    const cursorId = Number(query.cursor);
    const cursorIndex = filtered.findIndex((p) => p.id === cursorId);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1; // start after the cursor item
    }
  }

  // Get one extra to check if there are more
  const data = filtered.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < filtered.length;
  const lastItem = data[data.length - 1];
  const nextCursor = hasMore && lastItem ? String(lastItem.id) : null;

  return {
    data,
    meta: { nextCursor, hasMore },
  };
}

// --- 5. Demo ---

function main(): void {
  console.log('=== Pagination Examples ===\n');

  // Offset-based pagination
  console.log('--- Offset-based: Page 1 ---');
  const page1 = findProducts({}, { page: 1, limit: 5 });
  console.log('Data:', page1.data.map((p) => p.name));
  console.log('Meta:', page1.meta);

  console.log('\n--- Offset-based: Page 2 ---');
  const page2 = findProducts({}, { page: 2, limit: 5 });
  console.log('Data:', page2.data.map((p) => p.name));
  console.log('Meta:', page2.meta);

  console.log('\n--- Offset-based: Last page ---');
  const lastPage = findProducts({}, { page: 10, limit: 5 });
  console.log('Data:', lastPage.data.map((p) => p.name));
  console.log('Meta:', lastPage.meta);

  console.log('\n--- Offset-based: With filter ---');
  const electronics = findProducts({ category: 'electronics' }, { page: 1, limit: 5 });
  console.log('Electronics page 1:', electronics.data.map((p) => p.name));
  console.log('Meta:', electronics.meta);

  // Edge cases
  console.log('\n--- Edge cases ---');
  const empty = findProducts({ category: 'nonexistent' }, { page: 1, limit: 10 });
  console.log('Empty result:', empty);

  const overLimit = findProducts({}, { page: 1, limit: 999 }); // clamped to 100
  console.log('Over limit (clamped to 100):', overLimit.meta.limit);

  const negativePage = findProducts({}, { page: -5, limit: 10 }); // clamped to 1
  console.log('Negative page (clamped to 1):', negativePage.meta.page);

  // Cursor-based pagination
  console.log('\n--- Cursor-based: First batch ---');
  const batch1 = findProductsByCursor({}, { limit: 5 });
  console.log('Data:', batch1.data.map((p) => p.name));
  console.log('Meta:', batch1.meta);

  console.log('\n--- Cursor-based: Second batch ---');
  const batch2 = findProductsByCursor({}, { cursor: batch1.meta.nextCursor!, limit: 5 });
  console.log('Data:', batch2.data.map((p) => p.name));
  console.log('Meta:', batch2.meta);

  console.log('\nDone.');
}

main();
