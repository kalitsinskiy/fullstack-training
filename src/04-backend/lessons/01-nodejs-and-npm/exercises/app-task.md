# App Task: Initialize Secret Santa Backend Services

Create two backend services **at the repo root** (not inside `src/`).
These are real applications that you will develop throughout the course.

---

## 1. santa-api (NestJS + Fastify adapter, port 3001)

The main API — auth, users, rooms, wishlists, assignments.

### Create the project

```bash
# From the repo root:
npx @nestjs/cli new santa-api --package-manager npm --skip-git
cd santa-api
```

### Switch from Express to Fastify

NestJS uses Express by default. We want Fastify (faster, schema-based validation).

1. Install the adapter:
   ```bash
   npm install @nestjs/platform-fastify
   ```

2. Open `santa-api/src/main.ts`. Right now it uses `NestFactory.create(AppModule)` — that's Express.
   
   **Your task:** Change it to use `FastifyAdapter`. You'll need:
   - Import `FastifyAdapter` and `NestFastifyApplication` from `@nestjs/platform-fastify`
   - Pass `new FastifyAdapter()` as the second argument to `NestFactory.create`
   - Use `NestFastifyApplication` as the generic type
   - Listen on port **3001** (not 3000) with host `'0.0.0.0'`

   > Hint: check [NestJS Fastify docs](https://docs.nestjs.com/techniques/performance) if stuck.

### Add a health endpoint

Open `santa-api/src/app.controller.ts`. Add a new `GET /health` route that returns:
```json
{ "status": "ok" }
```

You already have an example of `@Get()` in the same file — follow the same pattern.

### Verify

```bash
cd santa-api
npm run start

# In another terminal:
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

---

## 2. santa-notifications (raw Fastify, port 3002)

The notification service — notifications, anonymous messages, real-time push.

Unlike santa-api where NestJS CLI sets everything up, here you build from scratch — just like the `http-server.ts` example you ran earlier, but with Fastify instead of raw `http`.

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

Both services running at the same time:

```bash
curl http://localhost:3001/health   # {"status":"ok"}  — santa-api (NestJS)
curl http://localhost:3002/health   # {"status":"ok"}  — santa-notifications (Fastify)
```

Your repo root should now look like:

```
fullstack-training/
  santa-api/              <-- NestJS project
  santa-notifications/    <-- Fastify project
  src/
    04-backend/
    ...
```
