# App Task: Initialize santa-api + Users & Rooms modules

Create the **santa-api** service at the **repo root** (not inside `src/`).
This is the main API for the Secret Santa app — it will host auth, users, rooms, wishlists, and assignments.

> Prerequisites: you should already have `santa-notifications/` from Lesson 01.

---

## Part 1 — Bootstrap santa-api

### 1.1 Generate the project with NestJS CLI

```bash
# From the repo root:
npx @nestjs/cli new santa-api --package-manager npm --skip-git
cd santa-api
```

The CLI creates a NestJS project with Express as the default HTTP adapter.

### 1.2 Switch from Express to Fastify

We want Fastify (faster, schema-based validation) — same engine you've already been using in santa-notifications.

1. Install the Fastify adapter:
   ```bash
   npm install @nestjs/platform-fastify
   ```

2. Open `santa-api/src/main.ts`. Right now it uses `NestFactory.create(AppModule)` — that's Express.

   **Your task:** change it to use `FastifyAdapter`. You'll need:
   - Import `FastifyAdapter` and `NestFastifyApplication` from `@nestjs/platform-fastify`
   - Pass `new FastifyAdapter()` as the second argument to `NestFactory.create`
   - Use `NestFastifyApplication` as the generic type
   - Listen on port **3001** (not 3000) with host `'0.0.0.0'`

   > Hint: check [NestJS Fastify docs](https://docs.nestjs.com/techniques/performance) if stuck.

### 1.3 Add a health endpoint

Open `santa-api/src/app.controller.ts`. Add a new `GET /health` route that returns:

```json
{ "status": "ok" }
```

You already have an example of `@Get()` in the same file — follow the same pattern.

### 1.4 Verify

```bash
cd santa-api
npm run start

# In another terminal:
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

Both services should now run side by side:

```bash
curl http://localhost:3001/health   # {"status":"ok"}  — santa-api (NestJS)
curl http://localhost:3002/health   # {"status":"ok"}  — santa-notifications (Fastify)
```

---

## Part 2 — UsersModule

Generate the module + service + controller skeleton:

```bash
cd santa-api
npx nest generate module users
npx nest generate service users
npx nest generate controller users
```

### 2.1 UsersService — in-memory storage

In `src/users/users.service.ts`:
- Use a `Map<string, User>` as private storage (no DB yet — Mongoose comes in Lesson 07)
- Define a `User` shape: `{ id: string; name: string; email: string; createdAt: Date }`
- Methods:
  - `create({ name, email })` — generate `id` (use `crypto.randomUUID()`), set `createdAt`, store, return the user
  - `findById(id)` — return the user or `undefined`

### 2.2 UsersController — two endpoints

In `src/users/users.controller.ts`:

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/users` | `{ name, email }` | 201 + created user |
| `GET` | `/users/:id` | — | 200 + user, or `NotFoundException` (404) |

> Don't add validation yet — that's Lesson 05. For now, trust the input.

---

## Part 3 — RoomsModule

```bash
npx nest generate module rooms
npx nest generate service rooms
npx nest generate controller rooms
```

### 3.1 RoomsService — in-memory storage

In `src/rooms/rooms.service.ts`:
- `Map<string, Room>` storage
- `Room` shape: `{ id: string; name: string; ownerId: string; code: string; members: string[]; createdAt: Date }`
- Methods:
  - `create({ name, ownerId })` — generate `id`, generate a unique 6-char `code` (e.g. `Math.random().toString(36).slice(2, 8).toUpperCase()`), `members` starts as `[ownerId]`, return the room
  - `findAll()` — return all rooms
  - `findById(id)` — return the room or `undefined`
  - `findByCode(code)` — return the room or `undefined`
  - `addMember(code, userId)` — push `userId` into `members` if not already there; return the updated room or `undefined` if room not found

### 3.2 RoomsController — four endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/rooms` | `{ name, ownerId }` | 201 + created room |
| `GET` | `/rooms` | — | 200 + array |
| `GET` | `/rooms/:id` | — | 200 + room, or 404 |
| `POST` | `/rooms/:code/join` | `{ userId }` | 200 + updated room, or 404 |

---

## Part 4 — Wire everything together

`UsersModule` and `RoomsModule` should already be auto-imported into `AppModule` thanks to `nest generate`. Verify `src/app.module.ts` has them in the `imports: []` array.

---

## Final verification

```bash
cd santa-api
npm run start

# Create a user
curl -s -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
# Expected: 201 with { id, name, email, createdAt }

# Save the user id, then create a room owned by them
curl -s -X POST http://localhost:3001/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Holiday Party","ownerId":"<user-id-from-above>"}'
# Expected: 201 with { id, name, ownerId, code, members: [<ownerId>], createdAt }

# List rooms
curl -s http://localhost:3001/rooms
# Expected: array with one room

# Join the room (use the code from create response)
curl -s -X POST http://localhost:3001/rooms/<CODE>/join \
  -H "Content-Type: application/json" \
  -d '{"userId":"<another-user-id>"}'
# Expected: room with two members
```

## Final layout

```
fullstack-training/
  santa-api/              <-- NestJS + UsersModule + RoomsModule
  santa-notifications/    <-- Fastify (from Lesson 01)
  src/
    04-backend/
    ...
```

Lesson 05 will add validation (DTOs + ValidationPipe), interceptors, exception filters, and a WishlistModule on top of this.
