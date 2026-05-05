export {};
// ============================================
// JSON SCHEMA VALIDATION Example
// ============================================
// Run from santa-notifications/:  npx ts-node examples/06-validation-and-error-handling/json-schema-validation.ts
//
// Demonstrates Fastify's built-in JSON Schema validation:
// - Request body validation
// - Query parameter validation
// - Response serialization
// - Custom error formatting for validation errors

import Fastify, { FastifyError } from 'fastify';

// By default Fastify configures Ajv with `removeAdditional: true`, which
// silently strips unknown fields instead of rejecting them. To make
// `additionalProperties: false` actually reject the request (returning 400),
// we override the Ajv option here.
const app = Fastify({
  ajv: {
    customOptions: {
      removeAdditional: false,
    },
  },
  logger: {
    level: 'warn',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  },
});

// ---- Route 1: Create User ----
// Body is validated against JSON Schema automatically.
// If validation fails, Fastify returns 400 before the handler runs.

app.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 50 },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0, maximum: 150 },
        role: { type: 'string', enum: ['user', 'admin'], default: 'user' },
      },
      additionalProperties: false,
    },
    // Response schema is used for SERIALIZATION (faster JSON output),
    // not validation. Properties not listed here are stripped from the response.
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const { name, email, role } = request.body as {
    name: string;
    email: string;
    role: string;
  };

  const user = { id: crypto.randomUUID(), name, email, role };
  reply.status(201).send(user);
});

// ---- Route 2: List Users with Query Params ----
// Validates query string parameters too.

app.get('/users', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        role: { type: 'string', enum: ['user', 'admin'] },
      },
    },
  },
}, async (request) => {
  const { page, limit, role } = request.query as {
    page: number;
    limit: number;
    role?: string;
  };

  return {
    message: 'Listing users',
    filters: { page, limit, role: role ?? 'all' },
    // Note: page and limit are already numbers thanks to Fastify's coercion
    types: {
      page: typeof page,   // "number" — coerced from query string
      limit: typeof limit,  // "number"
    },
  };
});

// ---- Route 3: URL Params ----

app.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
      },
    },
  },
}, async (request) => {
  const { id } = request.params as { id: string };
  return { message: `Looking up user ${id}` };
});

// ---- Custom error formatting for validation errors ----

app.setErrorHandler((error: FastifyError, _request, reply) => {
  if (error.validation) {
    // Fastify sets error.validation for schema validation failures
    reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation.map((v) => ({
          field: v.instancePath || v.params?.missingProperty || 'unknown',
          message: v.message,
          keyword: v.keyword,
        })),
      },
    });
    return;
  }

  reply.status(500).send({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
});

// ---- Bootstrap & Demo ----

async function main() {
  await app.listen({ port: 3000, host: '0.0.0.0' });
  console.log('JSON Schema Validation Example running on http://localhost:3000\n');

  const base = 'http://localhost:3000';

  async function test(label: string, method: string, url: string, body?: unknown) {
    console.log(`--- ${label} ---`);
    const opts: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${base}${url}`, opts);
    const data = await res.json();
    console.log(`${method} ${url} -> ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  }

  // Valid create
  await test('Valid user', 'POST', '/users', {
    name: 'Alice', email: 'alice@example.com',
  });

  // Missing required fields
  await test('Missing name & email', 'POST', '/users', {});

  // Name too short
  await test('Name too short', 'POST', '/users', {
    name: 'A', email: 'a@b.com',
  });

  // Invalid email format
  await test('Invalid email', 'POST', '/users', {
    name: 'Bob', email: 'not-email',
  });

  // Extra field (additionalProperties: false)
  await test('Extra field rejected', 'POST', '/users', {
    name: 'Charlie', email: 'c@d.com', hackField: true,
  });

  // Query params — integers coerced from strings
  await test('Query params', 'GET', '/users?page=2&limit=5');

  // Invalid query param
  await test('Invalid query (page=0)', 'GET', '/users?page=0');

  // UUID param validation
  await test('Valid UUID param', 'GET', `/users/${crypto.randomUUID()}`);
  await test('Invalid UUID param', 'GET', '/users/not-a-uuid');

  await app.close();
  console.log('Done!');
}

main();
