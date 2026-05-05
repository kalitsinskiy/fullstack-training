export {};
// ============================================
// ERROR HANDLER Exercise
// ============================================
// Run from santa-notifications/:  npx ts-node exercises/06-validation-and-error-handling/error-handler.ts
//
// Implement custom error classes and a Fastify error handler that maps them
// to proper HTTP responses with consistent formatting.

import Fastify from 'fastify';

// ============================================
// Part 1: Custom Error Classes
// ============================================

// TODO 1: Create an AppError base class extending Error
// Properties:
//   - message: string (inherited from Error)
//   - statusCode: number (default 500)
//   - code: string (default 'INTERNAL_ERROR')
//   - isOperational: boolean (default true) — true for expected errors, false for bugs
// Constructor should:
//   - Call super(message)
//   - Set this.name = this.constructor.name
//   - Set all properties

// TODO 2: Create these subclasses of AppError:
//
// NotFoundError:
//   constructor(resource: string, id: string)
//   statusCode: 404, code: 'NOT_FOUND'
//   message: `${resource} with id "${id}" not found`
//
// ValidationError:
//   constructor(message: string, details: Array<{ field: string; message: string }>)
//   statusCode: 400, code: 'VALIDATION_ERROR'
//   Additional property: details array
//
// ConflictError:
//   constructor(message: string)
//   statusCode: 409, code: 'CONFLICT'
//
// UnauthorizedError:
//   constructor(message?: string)   // default: 'Authentication required'
//   statusCode: 401, code: 'UNAUTHORIZED'
//
// ForbiddenError:
//   constructor(message?: string)   // default: 'Access denied'
//   statusCode: 403, code: 'FORBIDDEN'
//
// RateLimitError:
//   constructor(retryAfterSeconds: number)
//   statusCode: 429, code: 'RATE_LIMITED'
//   message: `Too many requests. Retry after ${retryAfterSeconds} seconds`
//   Additional property: retryAfter number

// ============================================
// Part 2: Fastify App with Error Handler
// ============================================

const app = Fastify({
  logger: {
    level: 'warn',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  },
});

// TODO 3: Implement app.setErrorHandler(...)
// The handler should:
// a) Check if error is instanceof AppError AND isOperational:
//    - Log at warn level
//    - Return { success: false, error: { code, message } }
//    - If it is a ValidationError, also include "details" in the error object
//    - If it is a RateLimitError, set Retry-After header
//    - Use error.statusCode for the HTTP status
//
// b) Check if error.validation exists (Fastify schema validation):
//    - Return 400 with { success: false, error: { code: 'VALIDATION_ERROR', message, details } }
//
// c) Otherwise (unexpected error):
//    - Log at error level (full error object)
//    - Return 500 with { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }
//    - NEVER expose internal error details to the client

// ============================================
// Test Routes (provided — do not modify)
// ============================================

// These routes throw various errors to test your handler:

app.get('/items/:id', async (request) => {
  const { id } = request.params as { id: string };
  if (id === '999') {
    // TODO: throw new NotFoundError('Item', id)
    throw new Error('Replace me with NotFoundError');
  }
  return { id, name: 'Widget' };
});

app.post('/items', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name: { type: 'string', minLength: 1 },
        price: { type: 'number', minimum: 0 },
      },
    },
  },
}, async (request) => {
  const { name } = request.body as { name: string; price: number };
  if (name === 'duplicate') {
    // TODO: throw new ConflictError(`Item "${name}" already exists`)
    throw new Error('Replace me with ConflictError');
  }
  return { id: crypto.randomUUID().slice(0, 8), ...request.body as object };
});

app.post('/items/:id/validate', async (_request) => {
  // TODO: throw new ValidationError('Item validation failed', [
  //   { field: 'price', message: 'Price must be positive' },
  //   { field: 'category', message: 'Invalid category' },
  // ]);
  throw new Error('Replace me with ValidationError');
});

app.get('/secret', async (request) => {
  const token = request.headers.authorization;
  if (!token) {
    // TODO: throw new UnauthorizedError()
    throw new Error('Replace me with UnauthorizedError');
  }
  if (token !== 'Bearer admin-token') {
    // TODO: throw new ForbiddenError('Admin access required')
    throw new Error('Replace me with ForbiddenError');
  }
  return { secret: 42 };
});

app.get('/rate-limited', async () => {
  // TODO: throw new RateLimitError(60)
  throw new Error('Replace me with RateLimitError');
});

app.get('/crash', async () => {
  // Simulates a programming bug — should return generic 500
  const data: unknown = null;
  return (data as { value: string }).value;
});

// ============================================
// Bootstrap & Test
// ============================================

// TODO 4: After implementing everything, run the file and test:
//   curl http://localhost:3000/items/1          # 200 — success
//   curl http://localhost:3000/items/999        # 404 — NotFoundError
//   curl -X POST http://localhost:3000/items -H "Content-Type: application/json" -d '{"name":"duplicate","price":10}'  # 409
//   curl -X POST http://localhost:3000/items -H "Content-Type: application/json" -d '{}'                               # 400 — schema
//   # Note: include `-d '{}'` (empty body must still be valid JSON) — without -d, Fastify rejects with FST_ERR_CTP_EMPTY_JSON_BODY
//   curl -X POST http://localhost:3000/items/1/validate -H "Content-Type: application/json" -d '{}'                    # 400 — custom
//   curl http://localhost:3000/secret                                                                                  # 401
//   curl -H "Authorization: Bearer wrong" http://localhost:3000/secret                                                 # 403
//   curl http://localhost:3000/rate-limited                                                                            # 429
//   curl http://localhost:3000/crash                                                                                   # 500

async function main() {
  await app.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Error Handler Exercise running on http://localhost:3000');
  console.log('Test with the curl commands in the comments above.');
  console.log('Press Ctrl+C to stop.\n');
}

main();
