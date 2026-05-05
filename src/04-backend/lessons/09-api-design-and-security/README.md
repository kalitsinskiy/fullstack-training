# API Design & Security

## Quick Overview

Building APIs goes beyond just handling requests — you need proper documentation (Swagger), cross-origin support (CORS), pagination for large datasets, rate limiting to prevent abuse, and security headers to protect against common attacks. This lesson covers the essential practices for production-ready APIs.

## Key Concepts

### CORS (Cross-Origin Resource Sharing)

Browsers enforce the **Same-Origin Policy**: JavaScript on `http://localhost:3000` (your React app) cannot make requests to `http://localhost:3001` (your API) by default. CORS is the mechanism that relaxes this restriction.

**How it works:**
1. Browser sends a request to a different origin
2. For "simple" requests (GET, POST with standard headers), the browser sends the request and checks the response for `Access-Control-Allow-Origin`
3. For "complex" requests (PUT, DELETE, custom headers, JSON body), the browser first sends a **preflight** OPTIONS request to check if the actual request is allowed

```typescript
// Preflight request (automatic, sent by browser)
OPTIONS /api/rooms HTTP/1.1
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

// Preflight response (from your server)
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Max-Age: 86400
```

**NestJS + Fastify CORS configuration:**

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);

app.enableCors({
  origin: ['http://localhost:3000'],         // allowed origins (your frontend)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,                         // allow cookies/auth headers
  maxAge: 86400,                             // cache preflight for 24 hours
});
```

### Swagger / OpenAPI

Swagger (OpenAPI) generates interactive API documentation from your code. Consumers can see all endpoints, request/response schemas, and even test endpoints directly in the browser.

**Setup in NestJS:**

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Secret Santa API')
  .setDescription('API for managing Secret Santa rooms and wishlists')
  .setVersion('1.0')
  // Second arg is the security scheme name — pass the same name to @ApiBearerAuth('JWT').
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
  .addTag('auth')
  .addTag('rooms')
  .addTag('wishlists')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document); // available at /docs
```

**Decorators for documenting endpoints:**

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('rooms')
@ApiBearerAuth('JWT')      // matches the name passed to addBearerAuth above
@Controller('rooms')
export class RoomsController {
  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Room found' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }
}
```

**DTO documentation with decorators:**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Office Party 2025', description: 'Room name' })
  name: string;

  @ApiPropertyOptional({ example: '2025-12-20', description: 'Draw date' })
  drawDate?: string;
}
```

### Pagination

For endpoints that return lists, always support pagination. Two main approaches:

**Offset-based (page/limit)** — simpler, good for most cases:
```typescript
// Request: GET /rooms?page=2&limit=10
// Response:
{
  "data": [...],
  "meta": {
    "total": 45,
    "page": 2,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Cursor-based** — better for real-time data, infinite scroll:
```typescript
// Request: GET /notifications?cursor=abc123&limit=20
// Response:
{
  "data": [...],
  "meta": {
    "nextCursor": "def456",  // null if no more items
    "hasMore": true
  }
}
```

**Offset vs Cursor comparison:**

| | Offset (page/limit) | Cursor |
|---|---|---|
| Jump to page N | Yes | No |
| Consistent with inserts/deletes | No (items can shift) | Yes |
| Performance on large offsets | Slow (skip N rows) | Fast (seek from cursor) |
| Best for | Admin panels, search | Feeds, infinite scroll |

**Implementation pattern:**

```typescript
interface PaginationQuery {
  page?: number;   // default: 1
  limit?: number;  // default: 10, max: 100
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

async function paginate<T>(
  model: mongoose.Model<T>,
  filter: Record<string, any>,
  query: PaginationQuery,
): Promise<PaginatedResponse<T>> {
  // Query params arrive as strings — coerce, then clamp.
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    model.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      // `Math.max(1, ...)` keeps totalPages >= 1 for an empty result —
      // otherwise total=0 gives totalPages=0, which clients usually treat as "no pages exist".
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
```

### Rate Limiting

Rate limiting prevents abuse by restricting how many requests a client can make in a given time window. Essential for auth endpoints (prevent brute-force) and public APIs.

**Common algorithms:**
- **Fixed window**: count requests per time window (e.g., 100 req/minute). Simple but can allow bursts at window boundaries.
- **Sliding window**: smoother, counts requests in a rolling time window.
- **Token bucket**: client gets N tokens, spends one per request, tokens refill at fixed rate. Allows short bursts.

**NestJS rate limiting with `@nestjs/throttler`:**

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,    // time window in milliseconds (1 minute)
      limit: 100,    // max requests per window (global default)
    }]),
  ],
  providers: [
    // Apply ThrottlerGuard globally via APP_GUARD so DI resolves its dependencies.
    // `new ThrottlerGuard()` would fail — the guard needs Reflector + ThrottlerStorage injected.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

// Per-route override — replaces the global limit for this handler:
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 requests per minute
@Post('login')
login(@Body() dto: LoginDto) { ... }

// Skip throttling for specific routes (e.g. health checks):
@SkipThrottle()
@Get('health')
health() { return { status: 'ok' }; }
```

### Helmet (Security Headers)

Helmet sets various HTTP headers to protect against common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.).

```typescript
// For Fastify (NestJS with Fastify adapter)
import helmet from '@fastify/helmet';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Swagger UI ships inline scripts AND inline styles — both must be allowed,
      // otherwise /docs renders a blank page with a CSP error in the console.
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc:  ["'self'", "'unsafe-inline'"],
      imgSrc:    ["'self'", 'data:'],          // Swagger uses data: URIs for icons
    },
  },
});
```

**Headers Helmet sets:**
- `X-Content-Type-Options: nosniff` — prevents MIME type sniffing
- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- `Strict-Transport-Security` — forces HTTPS
- `X-XSS-Protection: 0` — disables buggy browser XSS filter
- `Content-Security-Policy` — restricts resource loading sources

### API Versioning

As your API evolves, you may need to maintain backward compatibility. Common strategies:

```typescript
// 1. URL versioning (most common, easiest)
GET /v1/rooms
GET /v2/rooms    // new version with breaking changes

// 2. Header versioning
GET /rooms
Accept-Version: 1

// 3. Query parameter versioning
GET /rooms?version=1
```

In NestJS, URL versioning is built-in:

```typescript
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

@Controller({ path: 'rooms', version: '1' })
export class RoomsV1Controller { ... }

@Controller({ path: 'rooms', version: '2' })
export class RoomsV2Controller { ... }
```

## Learn More

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [NestJS CORS](https://docs.nestjs.com/security/cors)
- [NestJS Swagger / OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [NestJS Rate Limiting](https://docs.nestjs.com/security/rate-limiting)
- [NestJS Versioning](https://docs.nestjs.com/techniques/versioning)
- [Helmet.js](https://helmetjs.github.io/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)

## How to Work

### One-time setup

`fastify`, `@fastify/cors` are listed in the **root `package.json`** so the `cors-config.ts` example can boot a real server. If you haven't run `npm install` at the repo root recently:

```bash
npm install                 # from the repo root
```

Without these, `cors-config.ts` will fail with `TS2307: Cannot find module 'fastify'`.

> The NestJS-specific dependencies (`@nestjs/swagger`, `@nestjs/throttler`, `@fastify/helmet`) are installed **inside `santa-api`** as part of the App Task — not at the repo root.

### Run

1. **Study runnable examples**:
   ```bash
   npx ts-node src/04-backend/lessons/09-api-design-and-security/examples/cors-config.ts      # starts a server on :3000
   npx ts-node src/04-backend/lessons/09-api-design-and-security/examples/pagination.ts       # offset + cursor demo
   npx ts-node src/04-backend/lessons/09-api-design-and-security/examples/rate-limiting.ts    # sliding window + token bucket
   ```
   `examples/swagger-setup.ts` is a reference file — read it and apply the patterns in santa-api.

2. **Complete exercises**:
   ```bash
   npx ts-node src/04-backend/lessons/09-api-design-and-security/exercises/pagination-exercise.ts
   ```
   `exercises/swagger-exercise.ts` is meant to be read and the TODOs applied in the actual NestJS app.

3. **Complete the App Task** below.

## App Task

See [exercises/app-task.md](exercises/app-task.md) — add Swagger documentation, offset-based pagination, Helmet headers (with the Swagger CSP gotcha), rate limiting on auth endpoints, and CORS to santa-api.
