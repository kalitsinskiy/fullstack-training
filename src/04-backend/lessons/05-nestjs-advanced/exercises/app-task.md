# App Task: Validation, Interceptors, Filters + WishlistModule in santa-api

You'll harden the request lifecycle in `santa-api`: every incoming body validated by DTOs, every request logged with timings, every error formatted into a consistent shape. Then you'll add a third domain module — `WishlistModule`.

> Prerequisites: Lesson 04 App Task — `santa-api` exists with `UsersModule` and `RoomsModule`.

---

## 0. Install validation dependencies

```bash
cd santa-api
npm install class-validator class-transformer
```

These were also used in this lesson's examples — you may already have them.

---

## 1. DTOs with class-validator

Convert your existing endpoint bodies from raw types into DTO classes with validation decorators. Put each DTO next to its module (e.g. `src/users/dto/create-user.dto.ts`).

### `CreateUserDto`
- `name`: string, min 2 chars
- `email`: valid email

### `CreateRoomDto`
- `name`: string, min 3 chars
- `ownerId`: string, UUID format

### `JoinRoomDto`
- `userId`: string, UUID format

### `UpdateWishlistDto` (used in Part 5)
- `userId`: string, UUID format
- `items`: array of strings, each min 1 char (use `@IsArray()`, `@IsString({ each: true })`, `@MinLength(1, { each: true })`)

Wire each DTO into the matching controller method via `@Body() dto: CreateUserDto` (etc.).

---

## 2. Global ValidationPipe

In `src/main.ts`, before `app.listen(...)`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // strip properties not in DTO
  forbidNonWhitelisted: true, // 400 if unknown property is sent
  transform: true,            // turn plain bodies into DTO class instances
}));
```

Verify: sending `{"name":"A","email":"not-an-email"}` to `POST /users` returns **400** with a list of validation messages.

---

## 3. LoggingInterceptor

Create `src/common/interceptors/logging.interceptor.ts`. It must:
- Read `method` and `url` from the incoming request
- Capture `Date.now()` before `next.handle()`
- After the response stream completes (use the RxJS `tap()` operator), log `${method} ${url} — ${duration}ms`

Apply it globally in `main.ts`:

```typescript
app.useGlobalInterceptors(new LoggingInterceptor());
```

Verify: every request prints a one-line log to the console with timing.

---

## 4. Global AllExceptionsFilter

Create `src/common/filters/all-exceptions.filter.ts`. Use `@Catch()` (no arg = catches everything).

For each caught exception:
- If `instanceof HttpException` → use its status and message
- Else → status `500`, message `'Internal server error'`

Always respond with this shape:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

Apply globally:
```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```

> Use the Fastify reply API: `host.switchToHttp().getResponse<FastifyReply>().status(...).send(...)`.

Verify: `GET /users/does-not-exist` returns 404 in the new envelope shape.

---

## 5. WishlistModule

```bash
cd santa-api
npx nest generate module wishlist
npx nest generate service wishlist
npx nest generate controller wishlist
```

### 5.1 WishlistService — in-memory

In `src/wishlist/wishlist.service.ts`:
- Storage: `Map<string, string[]>` — key is `${roomId}:${userId}`, value is the items array
- Methods:
  - `set(roomId, userId, items)` → store and return `{ roomId, userId, items }`
  - `get(roomId, userId)` → return the wishlist or `undefined`

### 5.2 WishlistController

Use route prefix `rooms/:roomId/wishlist`:

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/rooms/:roomId/wishlist` | `UpdateWishlistDto` | 200 + `{ roomId, userId, items }` |
| `GET` | `/rooms/:roomId/wishlist/:userId` | — | 200 + wishlist, or 404 (`NotFoundException`) |

The 404 path proves your `AllExceptionsFilter` works for HttpExceptions thrown from services/controllers.

---

## Final verification

```bash
cd santa-api && npm run start

# Validation rejects bad input (Part 1+2)
curl -s -X POST http://localhost:3001/users -H "Content-Type: application/json" -d '{"name":"A","email":"nope"}'
# → 400 envelope with details

# Unknown properties rejected
curl -s -X POST http://localhost:3001/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"a@x.com","admin":true}'
# → 400 (forbidNonWhitelisted)

# Logging interceptor prints one line per request to the server stdout
# Format: POST /users — 5ms

# Exception filter envelope (Part 4)
curl -s http://localhost:3001/users/no-such-id
# → { "success": false, "statusCode": 404, "message": "...", "timestamp": "..." }

# Wishlist (Part 5) — first create a user + room as in Lesson 04, then:
curl -s -X POST http://localhost:3001/rooms/<roomId>/wishlist \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId>","items":["socks","book","mug"]}'
# → 200 with { roomId, userId, items: [...] }

curl -s http://localhost:3001/rooms/<roomId>/wishlist/<userId>
# → 200 with the wishlist

curl -s http://localhost:3001/rooms/<roomId>/wishlist/no-such-user
# → 404 envelope
```
