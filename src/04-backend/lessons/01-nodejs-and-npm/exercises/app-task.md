# App Task: Initialize santa-notifications

Create the **santa-notifications** service at the **repo root** (not inside `src/`).
This is a real application that you will develop throughout the course.

> 💡 santa-api (NestJS) will be set up later in **Lesson 04 — NestJS Fundamentals**.
> For now you only need santa-notifications, which is a great fit for this lesson:
> it's a clean `npm init` + `tsconfig.json` + a tiny HTTP server.

---

## santa-notifications (raw Fastify, port 3002)

The notification service — notifications, anonymous messages, real-time push.

You build this from scratch — just like the `http-server.ts` example you ran earlier, but with Fastify instead of raw `http`. Don't worry if Fastify feels new — Lesson 03 is dedicated to it. For now, treat the few Fastify lines below as a preview.

### Create the project

```bash
# From the repo root:
mkdir santa-notifications
cd santa-notifications
npm init -y
```

### Install dependencies

```bash
npm install fastify
npm install -D typescript @types/node ts-node
```

### Set up TypeScript

Create `santa-notifications/tsconfig.json` yourself. You need at minimum:
- `target`: ES2020
- `module`: commonjs
- `strict`: true
- `esModuleInterop`: true (so `import Fastify from 'fastify'` works)
- `outDir`: ./dist
- `rootDir`: ./src

> Hint: look at how the root `tsconfig.json` is configured for reference.

### Create the server

Create `santa-notifications/src/server.ts`.

**Your task:** Write a Fastify server that:
- Has a `GET /health` route returning `{ status: "ok" }`
- Listens on port **3002**
- Logs errors and exits if startup fails

You've seen raw Fastify in the lesson examples. The key differences from the `http` module:
- `import Fastify from 'fastify'` instead of `import * as http from 'node:http'`
- Routes are declared with `app.get('/path', async () => { return { ... } })` — Fastify auto-serializes objects to JSON
- Server starts with `await app.listen({ port: 3002, host: '0.0.0.0' })`

> Hint: use `Fastify({ logger: true })` to get built-in request logging for free.

### Verify

```bash
cd santa-notifications
npx ts-node src/server.ts

# In another terminal:
curl http://localhost:3002/health
# Expected: {"status":"ok"}
```

---

## Final check

Your repo root should now look like:

```
fullstack-training/
  santa-notifications/    <-- Fastify project (you just created)
  src/
    04-backend/
    ...
```

The `santa-api/` directory will appear later, in Lesson 04.
