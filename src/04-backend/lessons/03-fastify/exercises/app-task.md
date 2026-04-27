# App Task: Restructure santa-notifications into Fastify Plugins

Your `santa-notifications` currently has everything in one `server.ts`. In this task you'll restructure it into a proper Fastify plugin architecture, then add Fastify-specific features.

---

## 1. Restructure into plugins

Create this file structure:

```
santa-notifications/src/
  server.ts           ← entry point: calls buildApp() + listen()
  app.ts              ← buildApp() factory: assembles plugins + routes
  plugins/
    config.ts         ← config decorator (uses fp)
  routes/
    health.ts         ← GET /health
    notifications.ts  ← notification CRUD (moved from server.ts)
```

**Your tasks:**

1. Install `fastify-plugin`: `npm install fastify-plugin`

2. Create `plugins/config.ts` — a plugin that decorates the Fastify instance with a `config` object:
   - Read `PORT` and `NODE_ENV` from `process.env` with defaults (3002, "development")
   - Use `fp()` wrapper so the decorator is shared with all sibling plugins

   > Hint: `fastify.decorate('config', { port, env })` inside a function wrapped with `fp()`

3. Create `routes/health.ts` — move the `/health` route into its own plugin

4. Create `routes/notifications.ts` — move all notification CRUD routes here. Register with `{ prefix: '/api/notifications' }` so routes are just `/`, `/:id`, `/:id/read`

5. Create `app.ts` — a `buildApp()` function that:
   - Creates a Fastify instance with `{ logger: true }`
   - Registers config plugin, then routes
   - Returns the app (doesn't listen yet)

6. Simplify `server.ts` — just calls `buildApp()` and `listen()`

**Verify** — everything should still work exactly as before:
```bash
curl -s -X POST http://localhost:3002/api/notifications -H "Content-Type: application/json" -d '{"userId":"alice","type":"test","message":"hello"}'
curl -s http://localhost:3002/api/notifications
curl -s http://localhost:3002/health
```

---

## 2. Add JSON Schema validation to POST

Replace manual validation in `routes/notifications.ts` with Fastify's built-in JSON Schema:

```typescript
fastify.post('/', {
  schema: {
    body: {
      type: 'object',
      required: ['userId', 'type', 'message'],
      properties: {
        userId: { type: 'string', minLength: 1 },
        type: { type: 'string', minLength: 1 },
        message: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
  },
}, async (request, reply) => {
  // No manual if-checks needed — Fastify rejects invalid input before your handler runs
});
```

**Verify:** `curl -X POST http://localhost:3002/api/notifications -H "Content-Type: application/json" -d '{}'` → 400

---

## 3. Add custom error handler and 404 handler

Add both in `app.ts`. Import `FastifyError` for proper typing:

```typescript
import Fastify, { FastifyError } from 'fastify';

// Inside buildApp():
app.setErrorHandler((error: FastifyError, request, reply) => {
  if (error.validation) {
    reply.code(400).send({
      error: 'Validation Error',
      details: error.validation.map((v: { message?: string }) => v.message),
    });
    return;
  }
  request.log.error(error);
  reply.code(error.statusCode ?? 500).send({
    error: error.message ?? 'Internal Server Error',
  });
});

app.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    error: `Route ${request.method} ${request.url} not found`,
  });
});
```

> The `error` parameter must be typed as `FastifyError` — otherwise strict TypeScript treats it as `unknown`.

**Verify:**
- `curl http://localhost:3002/nonexistent` → `{"error":"Route GET /nonexistent not found"}`
- `curl -X POST .../api/notifications -d '{}'` → `{"error":"Validation Error","details":[...]}`

---

## 4. Add a timing plugin with X-Response-Time header

Create `plugins/timing.ts` — measures request duration and adds it as a response header.

This uses two hooks (`onRequest` + `onSend`) and `decorateRequest`:

```typescript
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

// TypeScript needs to know about the new property on FastifyRequest.
// This is called "declaration merging":
declare module 'fastify' {
  interface FastifyRequest {
    startTime: number;
  }
}

async function timingPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('startTime', 0);

  fastify.addHook('onRequest', async (request) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onSend', async (request, reply) => {
    const elapsed = Date.now() - request.startTime;
    reply.header('X-Response-Time', `${elapsed}ms`);
  });
}

export default fp(timingPlugin, { name: 'timing' });
```

> Without the `declare module 'fastify'` block, TypeScript will error:
> `Property 'startTime' does not exist on type 'FastifyRequest'`.

Register it in `app.ts` alongside the config plugin.

**Verify:** `curl -v http://localhost:3002/health 2>&1 | grep X-Response-Time` → `X-Response-Time: <N>ms`

---

## Final verification

```bash
cd santa-notifications && npx ts-node src/server.ts

# All CRUD still works
curl -s http://localhost:3002/health
curl -s -X POST http://localhost:3002/api/notifications -H "Content-Type: application/json" -d '{"userId":"alice","type":"room.created","message":"test"}'
curl -s http://localhost:3002/api/notifications

# Schema validation
curl -s -X POST http://localhost:3002/api/notifications -H "Content-Type: application/json" -d '{}'
# → 400 {"error":"Validation Error","details":["must have required property 'userId'"]}

# Timing header
curl -v http://localhost:3002/health 2>&1 | grep X-Response-Time
# → X-Response-Time: 0ms

# 404
curl -s http://localhost:3002/nonexistent
# → {"error":"Route GET /nonexistent not found"}
```
