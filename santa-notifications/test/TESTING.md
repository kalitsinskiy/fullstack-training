# Testing santa-notifications — the approach

Same philosophy as santa-api, in a Fastify context: **component (HTTP) tests**
that boot the real app and exercise it end-to-end against an **in-memory
MongoDB**. The only difference is the driver — Fastify has `app.inject()` built
in, so there's no `supertest` and no real network socket.

## Layout

Tests live in **`test/`**, never next to the source.

```
test/
  helpers/db.ts          # in-memory Mongo lifecycle (provided)
  notifications.test.ts  # 1 worked example + it.todo scenarios
```

## How to write one

```ts
const res = await app.inject({
  method: 'POST',
  url: '/api/notifications',
  payload: { userId, type: 'assignment', message: 'You have a giftee!' },
});
expect(res.statusCode).toBe(201);
expect(res.json()).toMatchObject({ type: 'assignment' });
```

`setupTestDb` / `teardownTestDb` / `clearTestDb` manage the database; `clearTestDb`
runs in `beforeEach` so every test starts clean.

## What to test

- **Health** — `GET /health` (the worked example).
- **Validation** — Fastify's JSON-schema validation returns `400` on a bad body.
- **CRUD** — create/list/get/patch-read/delete notifications, including `404`s.
- **As you add features in later lessons** (RabbitMQ consumer, WebSocket push,
  anonymous messaging) test them the same way: drive the HTTP surface, and for
  the consumer assert that handling an event writes the expected document.

## Run

```bash
npm test
```
