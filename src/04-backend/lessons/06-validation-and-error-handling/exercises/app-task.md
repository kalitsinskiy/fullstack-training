# App Task: JSON Schema, Custom Errors & Pino Logging

This lesson hardens both services. In **santa-notifications** (raw Fastify) you add JSON Schema validation, a custom error hierarchy, a centralized error handler, and Pino with pretty output. In **santa-api** (NestJS) you replace the default logger with `nestjs-pino`.

> Prerequisites: santa-notifications from Lessons 01-03 (with Fastify plugin structure) and santa-api from Lessons 04-05.

---

## Part A — santa-notifications

### A.1 One-time install

```bash
cd santa-notifications
npm install ajv ajv-formats
npm install -D pino-pretty
```

### A.2 JSON Schema on every route

Add a `schema` block to every notification route — at minimum the `POST` route, ideally also `GET` query params and path `:id`.

For `POST /api/notifications`:

```typescript
fastify.post('/', {
  schema: {
    body: {
      type: 'object',
      required: ['userId', 'type', 'message'],
      properties: {
        userId: { type: 'string', format: 'uuid' },
        type: {
          type: 'string',
          enum: ['room_invite', 'assignment', 'wishlist_update', 'system'],
        },
        message: { type: 'string', minLength: 1, maxLength: 500 },
      },
      additionalProperties: false,
    },
  },
}, handler);
```

For `GET /api/notifications` accept an optional `userId` query (uuid format).
For `GET/PATCH/DELETE /api/notifications/:id` accept `id` as a numeric string in the params schema.

> If your IDs are still incrementing integers from Lesson 02, use `pattern: '^\\d+$'` instead of `format: 'uuid'` for `:id` until Lesson 07 swaps storage to MongoDB ObjectIds.

Verify: `curl -X POST .../api/notifications -d '{}'` → **400** with Fastify's validation message.

### A.3 Custom error hierarchy

Create `src/errors.ts` with at least:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id "${id}" not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly details: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

Refactor `routes/notifications.ts` so missing entities **throw** `new NotFoundError('Notification', id)` instead of inline `reply.code(404).send({...})`.

### A.4 Centralized error handler

Move all error formatting into `app.ts`:

```typescript
app.setErrorHandler((error, request, reply) => {
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

  request.log.error({ err: error }, 'Unhandled error');
  return reply.status(500).send({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});
```

Every error response now uses the same envelope.

### A.5 Pino with pretty output (development)

Update Fastify config in `app.ts`:

```typescript
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
      : undefined,
  },
});
```

Replace any remaining `console.log` calls in your routes/plugins with `request.log.info(...)` (inside handlers) or `app.log.info(...)` (at startup).

### A.6 Verify santa-notifications

```bash
cd santa-notifications
npx ts-node src/server.ts

# Validation error → 400 envelope
curl -s -X POST http://localhost:3002/api/notifications -H "Content-Type: application/json" -d '{}'
# → {"success":false,"error":{"code":"VALIDATION_ERROR",...}}

# Unknown property rejected
curl -s -X POST http://localhost:3002/api/notifications -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000000","type":"system","message":"hi","extra":"nope"}'
# → 400 (additionalProperties: false)

# NotFoundError envelope
curl -s http://localhost:3002/api/notifications/999999
# → {"success":false,"error":{"code":"NOT_FOUND","message":"Notification with id ..."}}

# Logs in the server terminal are colored, with HH:MM:ss timestamps
```

---

## Part B — santa-api

### B.1 Install nestjs-pino

```bash
cd santa-api
npm install nestjs-pino pino-http
npm install -D pino-pretty
```

### B.2 Wire LoggerModule into AppModule

In `src/app.module.ts`:

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
    // ...UsersModule, RoomsModule, WishlistModule
  ],
})
export class AppModule {}
```

### B.3 Replace the default logger in main.ts

```typescript
import { Logger } from 'nestjs-pino';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  { bufferLogs: true },
);
app.useLogger(app.get(Logger));
```

After this, NestJS startup banner, request logs, and any `Logger` calls flow through Pino.

### B.4 Optional cleanup

If your Lesson 05 `LoggingInterceptor` still prints request timing, you can either:
- Keep it (it adds extra fields), or
- Remove it — `pinoHttp` already logs every request with method/url/duration.

### B.5 Verify santa-api

```bash
cd santa-api
npm run start

# Watch the server stdout — startup banner and request lines are now JSON-with-pretty-formatting,
# all coming from Pino. Each request prints one request line and one response line.

curl -s http://localhost:3001/health
# → { "status": "ok" }
# Server log shows: incoming request + request completed (with status, duration)
```

---

## What you have now

- **Validation at the boundary** in both services (JSON Schema in santa-notifications, class-validator in santa-api)
- **Consistent error envelopes** in both services
- **Structured logging** via Pino in both services (no more `console.log`)

Lesson 07 will replace the in-memory `Map` storage in both services with MongoDB via Mongoose.
