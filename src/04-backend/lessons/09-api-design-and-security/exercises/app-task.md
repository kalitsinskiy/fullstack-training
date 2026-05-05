# App Task: Production-ready API for santa-api

Make santa-api safe to expose to a real frontend. Add **Swagger** docs, **offset-based pagination** on list endpoints, **Helmet** headers (with the Swagger CSP gotcha), **rate limiting** on auth, and **CORS** for the React app.

> Prerequisites: santa-api with AuthModule from Lesson 08. The frontend (Lesson covers it later) will run on `http://localhost:3000`.

---

## 1. Install dependencies

```bash
cd santa-api
npm install @nestjs/swagger @nestjs/throttler @fastify/helmet
```

(`@fastify/cors` is not needed — NestJS's built-in `app.enableCors()` works on the Fastify adapter.)

---

## 2. Swagger / OpenAPI

### 2.1 Setup in `main.ts`

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Secret Santa API')
  .setDescription('API for managing Secret Santa rooms, wishlists, and assignments')
  .setVersion('1.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
  .addTag('auth')
  .addTag('users')
  .addTag('rooms')
  .addTag('wishlists')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document, {
  swaggerOptions: { persistAuthorization: true },
});
```

> Detail that bites people: the second arg to `addBearerAuth` (`'JWT'`) is the **security scheme name**. The same string must be passed to `@ApiBearerAuth('JWT')` on every protected controller — otherwise Swagger UI won't show the lock icon and the "Authorize" button won't apply your token to those endpoints.

### 2.2 Decorate every controller

For each existing controller (`AuthController`, `UsersController`, `RoomsController`, `WishlistController`):

- `@ApiTags('<tag>')` on the class — use `'auth'` / `'users'` / `'rooms'` / `'wishlists'` to match the tags from `DocumentBuilder` above
- `@ApiBearerAuth('JWT')` on the class (skip for public auth endpoints — `register`, `login`)
- `@ApiOperation({ summary: '...' })` on each method
- `@ApiResponse({ status, description, type? })` for each documented status code
- `@ApiParam` for path params, `@ApiQuery` for query params

### 2.3 Decorate every DTO

For each request/response DTO (`RegisterDto`, `LoginDto`, `CreateRoomDto`, ...):

- `@ApiProperty({ example, description })` on each required field
- `@ApiPropertyOptional(...)` on each optional field

Verify at `http://localhost:3001/docs` — you should see all endpoints under their tags, the lock icon on protected ones, and Authorize → paste token → "Try it out" should send `Authorization: Bearer <token>` correctly.

---

## 3. Offset-based pagination

### 3.1 Generic `paginate` helper

Create `src/common/pagination.ts`:

```typescript
import { Model, FilterQuery } from 'mongoose';

export interface PaginationQuery { page?: number; limit?: number }

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  query: PaginationQuery,
  sort: Record<string, 1 | -1> = { createdAt: -1 },
): Promise<PaginatedResponse<T>> {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
    model.countDocuments(filter).exec(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      // Keep totalPages >= 1 even when total = 0
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
```

### 3.2 Apply pagination to list endpoints

Update **`GET /api/rooms`** (currently returns a flat array — see `docs/api-contract.md`):

```typescript
@Get()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
findAll(
  @CurrentUser('id') userId: string,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
) {
  return this.roomsService.findByUser(userId, { page, limit });
}
```

`RoomsService.findByUser` calls `paginate(this.roomModel, { participants: userId }, { page, limit })`.

**Update `docs/api-contract.md`** for `GET /api/rooms` — the response shape changes from `[{ ... }]` to `{ data: [...], meta: {...} }`. This is a **breaking change** for any existing client; in a real product you'd add a deprecation header or a version bump, but for this lesson update the contract directly.

### 3.3 (Bonus) Same in santa-notifications

`GET /api/notifications` is already documented as paginated — wire it up the same way using a hand-rolled helper (no Mongoose-specific signature, since santa-notifications uses raw Fastify).

---

## 4. Helmet — and the Swagger CSP gotcha

### 4.1 Register Helmet

```typescript
import helmet from '@fastify/helmet';

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Swagger UI loads inline scripts and styles + needs to fetch its OpenAPI spec
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc:  ["'self'", "'unsafe-inline'"],
      imgSrc:    ["'self'", 'data:'],     // Swagger uses data: URIs for icons
    },
  },
});
```

> **The trap**: with default Helmet CSP, `/docs` renders a blank page and the browser console shows `Refused to execute inline script ... because it violates Content Security Policy`. Adding `'unsafe-inline'` to `scriptSrc` is the standard fix — but it does loosen XSS protection on the `/docs` route, which is why some teams instead host Swagger UI under a separate subdomain or behind a non-public route.

### 4.2 Verify

```bash
# Helmet headers are added by middleware, so they show up on every response —
# even on a 401 from a protected route. No token needed for this check.
curl -sI http://localhost:3001/api/users/me | grep -iE 'x-content-type-options|x-frame-options|strict-transport-security|content-security-policy'
```

You should see `nosniff`, `SAMEORIGIN`, `max-age=...`, and the CSP header. Then open `http://localhost:3001/docs` in a browser — the Swagger UI must render (not a blank page).

---

## 5. Rate limiting

### 5.1 Global limit (100 req/min/IP)

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    // ... other modules
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

### 5.2 Tighter limit on auth endpoints

`@Throttle()` on a route **overrides** the global limit for that route — it does *not* add an additional layer. So putting `@Throttle({ default: { limit: 5, ttl: 60_000 } })` on `POST /auth/login` means: "this route is 5/min, ignore the 100/min global". That's what you want for brute-force protection.

```typescript
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })   // 5 attempts / minute
  login(@Body() dto: LoginDto) { /* ... */ }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })   // 3 attempts / minute
  register(@Body() dto: RegisterDto) { /* ... */ }
}
```

### 5.3 Verify

```bash
# 6 fast login attempts → the 6th returns 429 Too Many Requests
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "Attempt $i: %{http_code}\n" \
    -X POST http://localhost:3001/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"x@x.com","password":"x"}'
done
```

The blocked response carries `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers. The client uses these to back off. Note: IP-based limiting has real edge cases — multiple users behind a NAT or mobile carrier share an outbound IP, so a per-IP cap can throttle innocent users; for production-grade limits prefer per-user (after auth) or per-API-key, with IP as a coarse fallback for unauthenticated routes.

---

## 6. CORS

```typescript
// main.ts — after app is created, before app.listen()
app.enableCors({
  origin: ['http://localhost:3000'],          // explicit origin, NOT '*'
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
});
```

> **The trap**: `credentials: true` together with `origin: '*'` is rejected by browsers. If you ever set the origin dynamically (`origin: true` or a function), make sure to echo back **the actual request origin** in the `Access-Control-Allow-Origin` response header — never `*`.

### Verify

```bash
# Preflight from the React origin → expects 204 with the right headers
curl -s -i -X OPTIONS http://localhost:3001/api/rooms \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type, authorization' \
  | head -10

# Look for these on the response:
#   Access-Control-Allow-Origin: http://localhost:3000
#   Access-Control-Allow-Credentials: true
#   Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
#   Access-Control-Allow-Headers: Content-Type, Authorization

# Same preflight from a disallowed origin → either no CORS headers or a CORS error
curl -s -i -X OPTIONS http://localhost:3001/api/rooms \
  -H 'Origin: http://evil.example.com' \
  -H 'Access-Control-Request-Method: POST' | head -5
```

---

## 7. Final verification checklist

- [ ] `http://localhost:3001/docs` renders Swagger UI (no blank page).
- [ ] All controllers/DTOs decorated; lock icon on protected endpoints.
- [ ] Swagger "Authorize" → paste JWT → "Try it out" sends `Authorization: Bearer ...`.
- [ ] `GET /api/rooms?page=1&limit=2` returns `{ data, meta }` with `totalPages >= 1`.
- [ ] Helmet headers present on every response.
- [ ] 6th login in 60 seconds → `429 Too Many Requests` with `Retry-After`.
- [ ] Preflight from `http://localhost:3000` succeeds; from `http://evil.example.com` does not.
- [ ] `docs/api-contract.md` updated for the paginated `GET /api/rooms` response.

## What you have now

A santa-api that's safe to expose to the React frontend (Lesson 11+). Lesson 10 (Testing) will write integration tests for these flows — including a regression test for the rate limiter and a CORS preflight test.
