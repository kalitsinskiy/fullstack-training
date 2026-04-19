// ============================================
// REST API DESIGN — principles and examples
// ============================================
// This file documents REST conventions with simulated request/response pairs.
// No actual HTTP server — focus is on design decisions.

// ============================================
// 1. Resource naming — nouns, plural, hierarchical
// ============================================

const urlExamples = {
  // ✅ Good
  'GET /users':                  'List all users',
  'GET /users/42':               'Get user 42',
  'POST /users':                 'Create a user',
  'PUT /users/42':               'Replace user 42 (full update)',
  'PATCH /users/42':             'Update user 42 (partial update)',
  'DELETE /users/42':            'Delete user 42',

  // Nested resources
  'GET /users/42/orders':        'All orders for user 42',
  'GET /users/42/orders/7':      'Order 7 of user 42',
  'POST /users/42/orders':       'Create order for user 42',

  // Versioning
  'GET /api/v1/users':           'Versioned API',

  // ❌ Bad — action verbs in URL (RPC style, not REST)
  'POST /createUser':            '❌ verb in URL',
  'GET /getUserById?id=42':      '❌ action as endpoint',
  'POST /users/42/delete':       '❌ use DELETE method instead',
};

console.log('=== URL Design ===');
Object.entries(urlExamples).forEach(([url, desc]) => {
  console.log(`  ${url.padEnd(40)} → ${desc}`);
});

// ============================================
// 2. HTTP Status Codes
// ============================================

const statusCodes = {
  // 2xx Success
  200: 'OK — GET, PUT/PATCH success',
  201: 'Created — POST success (include Location header)',
  204: 'No Content — DELETE success, no body',

  // 3xx Redirect
  301: 'Moved Permanently',
  304: 'Not Modified — client can use cached version',

  // 4xx Client errors
  400: 'Bad Request — validation error, malformed body',
  401: 'Unauthorized — not authenticated (missing/invalid token)',
  403: 'Forbidden — authenticated but not allowed',
  404: 'Not Found — resource does not exist',
  409: 'Conflict — duplicate email, optimistic lock conflict',
  422: 'Unprocessable Entity — semantic validation failed',
  429: 'Too Many Requests — rate limit exceeded',

  // 5xx Server errors
  500: 'Internal Server Error — unexpected crash',
  503: 'Service Unavailable — maintenance, overload',
};

console.log('\n=== HTTP Status Codes ===');
Object.entries(statusCodes).forEach(([code, desc]) => {
  console.log(`  ${code}: ${desc}`);
});

// ============================================
// 3. Request / Response shape
// ============================================

// Simulated request-response pairs
function simulateREST() {
  // POST /users — create
  const createRequest = {
    method: 'POST',
    url: '/api/v1/users',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    body: { name: 'Alice', email: 'alice@example.com', role: 'user' },
  };
  const createResponse = {
    status: 201,
    headers: { Location: '/api/v1/users/42' },
    body: { id: 42, name: 'Alice', email: 'alice@example.com', createdAt: '2024-01-01T00:00:00Z' },
  };

  // GET /users — list with pagination, filtering
  const listRequest = {
    method: 'GET',
    url: '/api/v1/users?page=1&limit=20&role=admin&sort=name&order=asc',
  };
  const listResponse = {
    status: 200,
    body: {
      data: [{ id: 1, name: 'Admin' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
  };

  // PATCH /users/42 — partial update
  const patchRequest = {
    method: 'PATCH',
    url: '/api/v1/users/42',
    body: { name: 'Alicia' }, // only fields to change
  };
  const patchResponse = {
    status: 200,
    body: { id: 42, name: 'Alicia', email: 'alice@example.com' },
  };

  // 400 — validation error shape
  const errorResponse = {
    status: 400,
    body: {
      error: 'Validation failed',
      details: [
        { field: 'email', message: 'Must be a valid email address' },
        { field: 'name',  message: 'Must be at least 2 characters' },
      ],
    },
  };

  return { createRequest, createResponse, listRequest, listResponse, patchRequest, patchResponse, errorResponse };
}

console.log('\n=== Request/Response Examples ===');
const examples = simulateREST();
console.log('Create:', JSON.stringify(examples.createResponse, null, 2));
console.log('Error:', JSON.stringify(examples.errorResponse, null, 2));

// ============================================
// 4. REST Constraints (HATEOAS - simplified)
// ============================================

// HATEOAS: responses include links to related actions
const hateoasResponse = {
  id: 42,
  name: 'Alice',
  email: 'alice@example.com',
  _links: {
    self:    { href: '/api/v1/users/42', method: 'GET' },
    update:  { href: '/api/v1/users/42', method: 'PUT' },
    delete:  { href: '/api/v1/users/42', method: 'DELETE' },
    orders:  { href: '/api/v1/users/42/orders', method: 'GET' },
  },
};

console.log('\n=== HATEOAS (Hypermedia) ===');
console.log(JSON.stringify(hateoasResponse, null, 2));

// ============================================
// 5. Common anti-patterns
// ============================================

const antiPatterns = [
  { bad: 'GET /deleteUser?id=42',          good: 'DELETE /users/42',           reason: 'Use correct HTTP verb' },
  { bad: 'POST /users/search',             good: 'GET /users?name=Alice',       reason: 'Use query params for filtering' },
  { bad: 'GET /users → returns all 10M',   good: 'GET /users?limit=20&page=1',  reason: 'Always paginate collections' },
  { bad: 'POST /users → returns 200',      good: 'POST /users → returns 201',   reason: 'Use 201 Created for new resources' },
  { bad: 'DELETE /users/42 → returns 200 + body', good: '→ 204 No Content',    reason: 'No body needed for DELETE' },
  { bad: 'PUT with partial data',          good: 'PATCH for partial update',    reason: 'PUT replaces, PATCH merges' },
];

console.log('\n=== REST Anti-patterns ===');
antiPatterns.forEach(({ bad, good, reason }) => {
  console.log(`  Bad: ${bad}`);
  console.log(`  Good: ${good}`);
  console.log(`  Reason: ${reason}\n`);
});
