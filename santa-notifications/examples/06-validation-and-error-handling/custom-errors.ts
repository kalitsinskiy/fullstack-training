export {};
// ============================================
// CUSTOM ERRORS Example
// ============================================
// Run from santa-notifications/:  npx ts-node examples/06-validation-and-error-handling/custom-errors.ts
//
// Demonstrates:
// - Custom error class hierarchy
// - Centralized error handler in Fastify
// - Different error types mapped to HTTP status codes

import Fastify, { FastifyError } from 'fastify';

// ============================================
// Error class hierarchy
// ============================================

class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Preserve proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details: Array<{ field: string; message: string }> = [],
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// ============================================
// Simulated data layer
// ============================================

interface Room {
  id: string;
  name: string;
  members: string[];
  maxMembers: number;
}

const rooms = new Map<string, Room>();
rooms.set('room-1', { id: 'room-1', name: 'Holiday Gift Exchange', members: ['alice', 'bob'], maxMembers: 3 });

// ============================================
// Fastify app with centralized error handling
// ============================================

const app = Fastify({ logger: false });

// ---- Centralized Error Handler ----
app.setErrorHandler((error: FastifyError | AppError, _request, reply) => {
  // 1. Known operational errors — safe to return details
  if (error instanceof AppError && error.isOperational) {
    const response: Record<string, unknown> = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };

    // Include validation details if present
    if (error instanceof ValidationError && error.details.length > 0) {
      (response.error as Record<string, unknown>).details = error.details;
    }

    console.log(`[WARN] ${error.code}: ${error.message}`);
    return reply.status(error.statusCode).send(response);
  }

  // 2. Fastify schema validation errors
  if ('validation' in error && error.validation) {
    console.log(`[WARN] Schema validation failed: ${error.message}`);
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: (error as FastifyError).validation,
      },
    });
  }

  // 3. Unknown/programming errors — log full error, return generic message
  console.error('[ERROR] Unexpected error:', error);
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      // Never expose stack traces or internal details in production
    },
  });
});

// ---- Routes that throw different error types ----

app.get('/rooms/:id', async (request) => {
  const { id } = request.params as { id: string };
  const room = rooms.get(id);
  if (!room) {
    throw new NotFoundError('Room', id);
  }
  return { success: true, data: room };
});

app.post('/rooms/:id/join', {
  schema: {
    body: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string', minLength: 1 },
      },
    },
  },
}, async (request) => {
  const { id } = request.params as { id: string };
  const { userId } = request.body as { userId: string };

  const room = rooms.get(id);
  if (!room) {
    throw new NotFoundError('Room', id);
  }

  if (room.members.includes(userId)) {
    throw new ConflictError(`User "${userId}" is already a member of room "${room.name}"`);
  }

  if (room.members.length >= room.maxMembers) {
    throw new ValidationError('Cannot join room', [
      { field: 'room', message: `Room "${room.name}" is full (${room.maxMembers}/${room.maxMembers})` },
    ]);
  }

  room.members.push(userId);
  return { success: true, data: room };
});

app.get('/secret', async (request) => {
  const auth = request.headers.authorization;
  if (!auth) {
    throw new UnauthorizedError();
  }
  return { success: true, data: { secret: 42 } };
});

app.get('/crash', async () => {
  // Simulate a programming error (not operational)
  const obj: unknown = null;
  return (obj as { name: string }).name; // TypeError: Cannot read properties of null
});

// ---- Bootstrap & Demo ----

async function main() {
  await app.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Custom Errors Example running on http://localhost:3000\n');

  const base = 'http://localhost:3000';

  async function test(label: string, method: string, url: string, opts: RequestInit = {}) {
    console.log(`--- ${label} ---`);
    const res = await fetch(`${base}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    const data = await res.json();
    console.log(`${method} ${url} -> ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  }

  // 200 — success
  await test('Get existing room', 'GET', '/rooms/room-1');

  // 404 — NotFoundError
  await test('Room not found', 'GET', '/rooms/room-999');

  // 409 — ConflictError (alice is already a member)
  await test('Duplicate join', 'POST', '/rooms/room-1/join', {
    body: JSON.stringify({ userId: 'alice' }),
  });

  // 200 — successful join
  await test('Join room', 'POST', '/rooms/room-1/join', {
    body: JSON.stringify({ userId: 'charlie' }),
  });

  // 400 — room is now full (3/3)
  await test('Room full', 'POST', '/rooms/room-1/join', {
    body: JSON.stringify({ userId: 'dave' }),
  });

  // 401 — UnauthorizedError
  await test('No auth header', 'GET', '/secret');

  // 400 — Fastify schema validation (empty body)
  await test('Schema validation fail', 'POST', '/rooms/room-1/join', {
    body: JSON.stringify({}),
  });

  // 500 — unexpected error (programming bug)
  await test('Unexpected crash', 'GET', '/crash');

  await app.close();
  console.log('Done! Every error was caught and formatted by the centralized handler.');
}

main();
