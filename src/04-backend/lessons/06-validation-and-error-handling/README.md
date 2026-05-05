# Validation & Error Handling

## Quick Overview

Validation is your first line of defense against bad data. Error handling determines how your API communicates failures. Structured logging makes debugging possible in production. This lesson covers three validation approaches (JSON Schema/AJV, Joi, class-validator), custom error hierarchies, centralized error handling, and Pino — the high-performance JSON logger used by Fastify.

## Key Concepts

### Why Validation Matters

Never trust client input. Without validation:
- SQL/NoSQL injection through unsanitized strings
- Type coercion bugs (string `"5"` where number `5` is expected)
- Business logic violations (negative prices, empty names)
- Memory exhaustion from unbounded arrays or strings

Validate **at the boundary** — where data enters your system (HTTP handlers, message consumers, file parsers).

### Validation Approaches — Comparison

| Feature | JSON Schema + AJV | Joi | class-validator |
|---------|------------------|-----|-----------------|
| Format | JSON object | Fluent JS API | TypeScript decorators |
| Best with | Fastify (built-in) | Standalone / Hapi | NestJS DTOs |
| Performance | Fastest (compiled) | Moderate | Moderate |
| Auto-coercion | Yes (Fastify) | Yes (configurable) | Via class-transformer |
| TypeScript DX | Need separate types | Need type extraction | Types ARE the schema |
| OpenAPI/Swagger | Native support | Via conversion | Via @nestjs/swagger |

**Our approach**: JSON Schema for `santa-notifications` (raw Fastify), class-validator for `santa-api` (NestJS).

### JSON Schema Basics

JSON Schema is a declarative format for describing the structure of JSON data:

```json
{
  "type": "object",
  "required": ["name", "email"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 50
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin"]
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 10
    }
  },
  "additionalProperties": false
}
```

### AJV — Fastify's Built-in Validator

Fastify uses AJV (Another JSON Validator) internally. When you define a schema on a route, Fastify validates automatically:

```typescript
import Fastify from 'fastify';

const app = Fastify({ logger: true });

// Define the schema inline on the route
app.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 2 },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0 },
      },
      additionalProperties: false,
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  // request.body is already validated and typed
  const { name, email } = request.body as { name: string; email: string };
  reply.status(201).send({ id: crypto.randomUUID(), name, email });
});
```

Fastify validates requests **before** the handler runs. If validation fails, it returns 400 automatically. Response schemas are used for serialization (faster JSON output), not validation.

You can also use AJV standalone:

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv); // adds "email", "uri", "date-time", etc.

const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 2 },
  },
};

const validate = ajv.compile(schema);

const valid = validate({ name: 'Alice' }); // true
const invalid = validate({ name: '' });     // false
console.log(validate.errors); // detailed error array
```

### Custom Error Classes

Create a hierarchy of error classes so your error handler can distinguish between different failure types:

```typescript
// Base application error
class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types
class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details: Array<{ field: string; message: string }>,
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

class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

The `isOperational` flag distinguishes expected errors (bad input, not found) from programmer bugs (null reference, type error). Operational errors should be returned to the client. Programming errors should be logged and return a generic 500.

### Centralized Error Handler

In Fastify, use `setErrorHandler` to catch all errors in one place:

```typescript
app.setErrorHandler((error, request, reply) => {
  // AppError — operational, safe to return details
  if (error instanceof AppError) {
    request.log.warn({ err: error, code: error.code }, error.message);
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && { details: error.details }),
      },
    });
  }

  // Fastify validation error (from JSON Schema)
  if (error.validation) {
    request.log.warn({ err: error }, 'Validation failed');
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation,
      },
    });
  }

  // Unknown error — log as error, return generic message
  request.log.error({ err: error }, 'Unhandled error');
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
```

### Structured Logging with Pino

**Why not console.log?**
- `console.log` outputs unstructured text — impossible to parse in production
- No log levels, no timestamps, no correlation
- Blocking I/O in Node.js — slows your server

**Pino** is a high-performance JSON logger. Fastify uses it by default:

```typescript
import Fastify from 'fastify';

// Fastify creates a Pino logger automatically
const app = Fastify({
  logger: {
    level: 'info', // trace, debug, info, warn, error, fatal
    // In production: JSON to stdout, processed by log aggregator
    // In development: use pino-pretty for readable output
  },
});
```

Install pino-pretty for development:
```bash
npm install -D pino-pretty
```

Run with pretty output:
```bash
node server.js | npx pino-pretty
```

Or configure in code (dev only):
```typescript
const app = Fastify({
  logger: {
    level: 'debug',
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
```

### Pino Log Levels

```typescript
app.log.trace('Very detailed debugging');  // 10
app.log.debug('Debugging information');     // 20
app.log.info('Normal operations');          // 30
app.log.warn('Something unexpected');       // 40
app.log.error('Error occurred');            // 50
app.log.fatal('App must shut down');        // 60
```

Set `level: 'info'` in production (ignores trace/debug). Set `level: 'debug'` in development.

### Child Loggers and Correlation IDs

Child loggers inherit parent properties and add context:

```typescript
// In a request hook — add a correlation ID to all logs for this request
app.addHook('onRequest', async (request) => {
  const correlationId = request.headers['x-correlation-id'] as string
    || crypto.randomUUID();

  // request.log is already a child logger scoped to this request
  // Fastify adds reqId automatically. You can add more context:
  request.log = request.log.child({ correlationId });
});

// In a route handler
app.get('/users/:id', async (request, reply) => {
  request.log.info({ userId: request.params.id }, 'Fetching user');
  // Output: {"level":30,"correlationId":"abc-123","userId":"42","msg":"Fetching user"}
});
```

### Pino in NestJS

Replace NestJS's default logger with Pino using `nestjs-pino`:

```bash
npm install nestjs-pino pino-http
npm install -D pino-pretty
```

```typescript
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      },
    }),
  ],
})
class AppModule {}
```

In `main.ts`:
```typescript
import { Logger } from 'nestjs-pino';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

## Learn More

- [JSON Schema Specification](https://json-schema.org/learn/getting-started-step-by-step)
- [AJV Documentation](https://ajv.js.org/)
- [Fastify Validation & Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [Pino Documentation](https://getpino.io/)
- [pino-pretty](https://github.com/pinojs/pino-pretty)
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
- [Fastify Error Handling](https://fastify.dev/docs/latest/Reference/Errors/)
- [class-validator](https://github.com/typestack/class-validator)
- [Joi Documentation](https://joi.dev/)

## How to Work

> **Important:** examples and exercises must run from the `santa-notifications/` directory.
> They use `pino-pretty` (worker thread transport) and `ajv-formats` — both set up inside `santa-notifications/`. Running from the repo root will hang (root tsconfig conflicts with Pino's transport worker).

### One-time setup

The examples and exercises use `pino-pretty`, `ajv`, and `ajv-formats`. Install them in `santa-notifications`:

```bash
cd santa-notifications
npm install ajv ajv-formats
npm install -D pino-pretty
```

### Run

1. **Study examples** (run from `santa-notifications/`):
   ```bash
   cd santa-notifications
   npx ts-node examples/06-validation-and-error-handling/json-schema-validation.ts
   npx ts-node examples/06-validation-and-error-handling/custom-errors.ts
   npx ts-node examples/06-validation-and-error-handling/pino-logging.ts
   ```

   Each example is **self-contained** — it starts a server, runs test requests, prints results, then closes.

2. **Complete exercises** (run from `santa-notifications/`):
   ```bash
   cd santa-notifications
   npx ts-node exercises/06-validation-and-error-handling/validation-exercise.ts
   npx ts-node exercises/06-validation-and-error-handling/error-handler.ts
   ```

3. **Complete the App Task** below.

## App Task

See [exercises/app-task.md](exercises/app-task.md) — JSON Schema + custom errors + centralized error handler + Pino in `santa-notifications`, plus `nestjs-pino` in `santa-api`.
