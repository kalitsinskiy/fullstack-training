# App Task: AuthModule for santa-api

Add a real authentication layer to **santa-api**: register, login, JWT-protected routes, and a `@CurrentUser()` decorator. By the end, every existing room/wishlist/user endpoint requires a valid token, and the `passwordHash: 'TODO_LESSON_08'` placeholder from Lesson 07 is gone.

> Prerequisites: santa-api with `UsersModule`, `RoomsModule`, `WishlistModule` persisted in MongoDB (Lesson 07).

---

## 1. Install dependencies

```bash
cd santa-api
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

## 2. Update the User schema

The `User` schema from Lesson 07 already declares `passwordHash` with `select: false`. That stays — but you now need to be able to **opt-in** to it during login.

In `UsersService` (or `UsersRepository`), add or update `findByEmail`:

```typescript
findByEmail(email: string, opts: { withPassword?: boolean } = {}) {
  const query = this.userModel.findOne({ email: email.toLowerCase() });
  if (opts.withPassword) {
    query.select('+passwordHash'); // overrides schema's select: false for this query only
  }
  return query.exec();
}
```

Why this matters: `select: false` is the right default for every query in the system (room lookups, listings, profile reads) — but the **one** place that legitimately needs the hash is the login flow.

Also delete or migrate any users created in Lesson 07 with `passwordHash: 'TODO_LESSON_08'` — those accounts cannot log in. Either wipe the `users` collection in mongosh or write a one-off migration script that hashes a default password for them.

## 3. AuthModule structure

Create `src/auth/`:

```
auth/
├── auth.module.ts
├── auth.service.ts
├── auth.controller.ts
├── jwt.strategy.ts
├── guards/
│   └── jwt-auth.guard.ts
├── decorators/
│   └── current-user.decorator.ts
└── dto/
    ├── register.dto.ts
    └── login.dto.ts
```

`AuthModule` imports `PassportModule`, `JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1h' } })`, and `UsersModule`. It provides `AuthService`, `JwtStrategy` and exports `JwtAuthGuard` for other modules to consume.

The exact wiring is in `examples/passport-jwt-strategy.ts` and `examples/auth-guard.ts` — read them before writing this part.

## 4. Endpoints

### `POST /api/auth/register`

Body: `{ email, password, displayName }`. Validation:
- `email` is a valid email
- `password` is 8+ chars
- `displayName` is 1–50 chars

Steps:
1. Lowercase the email.
2. If `findByEmail(email)` returns a user → throw `ConflictException` (409).
3. Hash the password with `bcrypt.hash(password, 10)`.
4. Create the user with `role: 'user'`.
5. Sign a JWT with payload `{ sub: user._id, email, role }`, expiry `1h`.

Response (matches `docs/api-contract.md`):

```json
{
  "id": "65f...",
  "email": "alice@example.com",
  "displayName": "Alice",
  "accessToken": "eyJ..."
}
```

Status codes: `201` on success, `400` on validation, `409` on duplicate email.

### `POST /api/auth/login`

Body: `{ email, password }`.

Steps:
1. `findByEmail(email, { withPassword: true })`.
2. If no user **or** `bcrypt.compare(password, user.passwordHash)` is `false` → throw `UnauthorizedException('Invalid credentials')`. **Use the same error for both cases** — this defends against email enumeration (an attacker who can distinguish "no such user" from "wrong password" can probe which emails are registered).
3. Sign a JWT with the same payload as register.

Response: `{ "accessToken": "eyJ..." }`.

Status codes: `200` on success, `401` on invalid credentials.

## 5. Protect existing routes

Apply `@UseGuards(JwtAuthGuard)` to:

- `UsersController` — `GET /api/users/me`, `PATCH /api/users/me`
- `RoomsController` — every method
- `WishlistController` — every method

Use `@CurrentUser('id')` to read the authenticated user's id, and replace any `userId` query param or body field that the client previously had to pass for "who am I" lookups:

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser('id') userId: string) {
  return this.usersService.findById(userId);
}
```

For `RoomsService` ownership checks (`creatorId`), the guard now guarantees `userId` is the authenticated user — so `RoomsService.delete(roomId, userId)` can compare `room.creatorId.toString() === userId` and throw `ForbiddenException` if they don't match. Note: that's **403** (we know who you are, but you can't do this), not 401.

## 6. JWT configuration

- Secret comes from `process.env.JWT_SECRET`. **Fail fast on startup** if it's not set — don't fall through to a hard-coded default in production code (the example file uses one only because it's an example).
- Token TTL: `1h`.
- Payload: `{ sub: userId, email, role }`. `iat` and `exp` are added automatically.

Add `JWT_SECRET=...` to your `.env` and make sure `dotenv` is loaded in `main.ts`.

## 7. Verify end-to-end

```bash
# 1. Register — gets a token
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"SecretPass1","displayName":"Alice"}'
# → { id, email, displayName, accessToken }

# 2. Same email again → 409
curl -s -i -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"SecretPass1","displayName":"Alice"}' | head -1
# → HTTP/1.1 409 Conflict

# 3. Login — gets a token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"SecretPass1"}' | jq -r .accessToken)

# 4. Wrong password → 401, same generic message
curl -s -i -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"wrong"}' | head -1
# → HTTP/1.1 401 Unauthorized

# 5. Hitting a protected route without a token → 401
curl -s -i http://localhost:3001/api/users/me | head -1
# → HTTP/1.1 401 Unauthorized

# 6. With a token — works
curl -s http://localhost:3001/api/users/me -H "Authorization: Bearer $TOKEN"
# → { id, email, displayName }

# 7. Tampered token → 401
curl -s -i http://localhost:3001/api/users/me \
  -H "Authorization: Bearer ${TOKEN}xxx" | head -1
# → HTTP/1.1 401 Unauthorized
```

## What you have now

A real auth boundary. Lesson 09 layers API design + security on top: rate limiting, helmet, CORS, OpenAPI documentation. Lesson 10 then writes integration tests for these auth flows.
