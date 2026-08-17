/* eslint-disable @typescript-eslint/no-unused-vars */
export {};
// ============================================
// VALIDATION Exercise
// ============================================
// Run from santa-notifications/:  npx ts-node exercises/06-validation-and-error-handling/validation-exercise.ts
//
// Write JSON Schemas for a user registration API and validate with AJV.
// Then integrate the schemas into Fastify routes.

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import Fastify, { FastifyError } from 'fastify';

// ============================================
// Part 1: AJV Standalone Validation
// ============================================

const ajv = new Ajv({ allErrors: true });
addFormats(ajv as unknown as Parameters<typeof addFormats>[0]);

// TODO 1: Define a JSON Schema for user registration
// The schema should validate:
//   - username: required string, minLength 3, maxLength 30, pattern: only alphanumeric and underscores
//   - email: required string, format "email"
//   - password: required string, minLength 8, maxLength 100
//   - age: optional integer, minimum 13, maximum 120
//   - role: optional string, enum: ["user", "moderator", "admin"], default: "user"
//   - interests: optional array of strings, maxItems 10, each item minLength 1, maxLength 50
//   - address: optional object with:
//       - street: required string
//       - city: required string
//       - zipCode: required string, pattern: 5 digits
//   - additionalProperties: false

const userRegistrationSchema: Record<string, unknown> = {
  type: 'object',
  required: ['username', 'email', 'password'],
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 30,
      pattern: '^[A-Za-z0-9_]+$',
    },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8, maxLength: 100 },
    age: { type: 'integer', minimum: 13, maximum: 120 },
    role: {
      type: 'string',
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    interests: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
      },
    },
    address: {
      type: 'object',
      required: ['street', 'city', 'zipCode'],
      properties: {
        street: { type: 'string', minLength: 1 },
        city: { type: 'string', minLength: 1 },
        zipCode: { type: 'string', pattern: '^\\d{5}$' },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

// Compile the schema
const validateUser = ajv.compile(userRegistrationSchema);

// TODO 2: Test your schema with these payloads.
// Uncomment each block, run the file, and verify the results.

// Valid user:
// console.log('--- Valid user ---');
// console.log(validateUser({
//   username: 'alice_123',
//   email: 'alice@example.com',
//   password: 'securePass1!',
//   age: 25,
//   interests: ['coding', 'gaming'],
// }));

// Invalid — missing required fields:
// console.log('\n--- Missing fields ---');
// console.log(validateUser({}));
// console.log(validateUser.errors);

// Invalid — username too short:
// console.log('\n--- Username too short ---');
// console.log(validateUser({ username: 'ab', email: 'a@b.com', password: '12345678' }));
// console.log(validateUser.errors);

// Invalid — bad email format:
// console.log('\n--- Bad email ---');
// console.log(validateUser({ username: 'alice', email: 'not-email', password: '12345678' }));
// console.log(validateUser.errors);

// Invalid — age below minimum:
// console.log('\n--- Age too low ---');
// console.log(validateUser({ username: 'alice', email: 'a@b.com', password: '12345678', age: 5 }));
// console.log(validateUser.errors);

// Invalid — extra field (additionalProperties: false):
// console.log('\n--- Extra field ---');
// console.log(validateUser({ username: 'alice', email: 'a@b.com', password: '12345678', hackField: true }));
// console.log(validateUser.errors);

// Invalid — bad address zipCode:
// console.log('\n--- Bad zipCode ---');
// console.log(validateUser({
//   username: 'alice',
//   email: 'a@b.com',
//   password: '12345678',
//   address: { street: '123 Main St', city: 'Kyiv', zipCode: 'ABCDE' },
// }));
// console.log(validateUser.errors);

// ============================================
// Part 2: Fastify Integration
// ============================================

// TODO 3: Create a Fastify app with a POST /register route
// - Use your userRegistrationSchema as the body schema in the route config
// - The handler should return { success: true, user: { ...body, id: <random-uuid> } } with 201
// - Add a custom error handler that formats validation errors nicely

// TODO 4: Create a GET /users route with query string validation
// Schema for querystring:
//   - page: integer, minimum 1, default 1
//   - limit: integer, minimum 1, maximum 50, default 10
//   - role: optional string, enum: ["user", "moderator", "admin"]
//   - search: optional string, minLength 1
// Handler returns: { page, limit, role, search }

// TODO 5: Start the server and test with curl:
//   curl -X POST http://localhost:3000/register \
//     -H "Content-Type: application/json" \
//     -d '{"username":"alice","email":"alice@example.com","password":"secure123"}'
//
//   curl "http://localhost:3000/users?page=1&limit=5&role=admin"
//
//   # Should fail:
//   curl -X POST http://localhost:3000/register \
//     -H "Content-Type: application/json" \
//     -d '{"username":"x","email":"bad"}'

const app = Fastify({
  ajv: {
    customOptions: {
      removeAdditional: false,
    },
    plugins: [addFormats as never],
  },
  logger: {
    level: 'warn',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  },
});

app.post(
  '/register',
  {
    schema: {
      body: userRegistrationSchema,
    },
  },
  async (request, reply) => {
    const user = request.body as Record<string, unknown>;

    // Echo the validated payload back with a generated id so the shape is easy to inspect.
    return reply.status(201).send({
      success: true,
      user: {
        id: crypto.randomUUID(),
        ...user,
      },
    });
  }
);

app.get(
  '/users',
  {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          role: { type: 'string', enum: ['user', 'moderator', 'admin'] },
          search: { type: 'string', minLength: 1 },
        },
        additionalProperties: false,
      },
    },
  },
  async (request) => {
    const query = request.query as {
      page: number;
      limit: number;
      role?: 'user' | 'moderator' | 'admin';
      search?: string;
    };

    return {
      page: query.page,
      limit: query.limit,
      role: query.role ?? 'all',
      search: query.search ?? '',
    };
  }
);

app.setErrorHandler((error: FastifyError, _request, reply) => {
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation.map((issue) => ({
          field: issue.instancePath || issue.params?.missingProperty || 'unknown',
          message: issue.message,
          keyword: issue.keyword,
        })),
      },
    });
  }

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message ?? 'An unexpected error occurred',
    },
  });
});

async function main() {
  // Part 1 tests run here if you want to inspect raw Ajv behavior without Fastify.
  console.log('--- Standalone AJV check ---');
  console.log(
    validateUser({
      username: 'alice_123',
      email: 'alice@example.com',
      password: 'securePass1!',
      age: 25,
      interests: ['coding', 'gaming'],
    })
  );

  await app.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Validation Exercise running on http://localhost:3000');
  console.log('Try POST /register and GET /users with the curl commands above.');
}

main();
