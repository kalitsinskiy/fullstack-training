# Authentication

## Quick Overview

Authentication answers "who are you?" while authorization answers "what are you allowed to do?" This lesson covers password hashing with bcrypt, token-based authentication with JWT, Passport.js strategies in NestJS, route protection with guards, and role-based access control (RBAC).

## Key Concepts

### Authentication vs Authorization

| | Authentication (AuthN) | Authorization (AuthZ) |
|---|---|---|
| Question | "Who are you?" | "What can you do?" |
| When | Login, every request with token | After authentication |
| Mechanism | Password, JWT, OAuth | Roles, permissions, policies |
| Example | User logs in with email + password | Admin can delete rooms, user cannot |

### Password Storage — Never Plain Text

Passwords must **never** be stored in plain text. If the database is breached, plain text passwords are immediately compromised.

**bcrypt** is the industry standard for password hashing:
- Adds a random **salt** (prevents rainbow table attacks)
- Is intentionally **slow** (configurable via salt rounds, also called "cost factor")
- Resistant to **timing attacks** (constant-time comparison)

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // 2^10 = 1024 iterations; increase for more security

// Hash a password
const hash = await bcrypt.hash('myPassword123', SALT_ROUNDS);
// Result: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

// Verify a password
const isValid = await bcrypt.compare('myPassword123', hash); // true
const isWrong = await bcrypt.compare('wrongPassword', hash); // false
```

The hash string contains: algorithm version (`$2b$`), cost factor (`$10$`), salt (22 chars), and hash (31 chars) — all in one string.

### JWT (JSON Web Token)

JWT is a compact, URL-safe token format for transmitting claims between parties.

**Structure**: `header.payload.signature` (three Base64-encoded parts separated by dots)

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzQyIiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSJ9.signature
|---- header ----|    |---------------- payload ------------------|  |-- sig --|
```

```typescript
// Header: algorithm + token type
{ "alg": "HS256", "typ": "JWT" }

// Payload: claims (data)
{
  "sub": "user_42",          // subject (user ID)
  "email": "alice@example.com",
  "role": "user",
  "iat": 1700000000,         // issued at (auto-added)
  "exp": 1700003600          // expires at (1 hour later)
}

// Signature: HMAC-SHA256(base64(header) + "." + base64(payload), secret)
```

**Important**: JWT payload is **not encrypted** — it is only Base64-encoded. Anyone can decode it. The signature only proves the token was not tampered with.

```typescript
import jwt from 'jsonwebtoken';

const SECRET = 'your-secret-key'; // in production, use env variable

// Sign (create) a token
const token = jwt.sign(
  { sub: 'user_42', email: 'alice@example.com', role: 'user' },
  SECRET,
  { expiresIn: '1h' },
);

// Verify (validate + decode) a token
const payload = jwt.verify(token, SECRET);
// { sub: 'user_42', email: 'alice@example.com', role: 'user', iat: ..., exp: ... }

// Decode without verification (do NOT use for auth decisions)
const decoded = jwt.decode(token);
```

### Access Tokens vs Refresh Tokens

| | Access Token | Refresh Token |
|---|---|---|
| Purpose | Authorize API requests | Get new access tokens |
| Lifetime | Short (15min - 1hr) | Long (7 - 30 days) |
| Stored in | Memory / HTTP-only cookie | HTTP-only cookie / secure storage |
| Sent with | Every API request (Authorization header) | Only to /auth/refresh endpoint |

Flow:
1. User logs in -> receives access token + refresh token
2. Access token sent with every request in `Authorization: Bearer <token>` header
3. When access token expires, send refresh token to get a new access token
4. When refresh token expires, user must log in again

### Passport.js and NestJS

**Passport.js** is the most popular authentication middleware for Node.js. It uses **strategies** to handle different auth methods.

**passport-local**: validates username + password (for login)
**passport-jwt**: validates JWT tokens (for protected routes)

In NestJS, Passport integrates via `@nestjs/passport`:

```typescript
// JWT Strategy — validates token on protected routes
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  // Called after token is verified; return value is set to request.user
  async validate(payload: { sub: string; email: string; role: string }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### NestJS AuthGuard

Guards in NestJS decide whether a request should be handled. `AuthGuard('jwt')` triggers the JWT strategy.

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Optional: customize error handling
  handleRequest<T>(err: any, user: T, info: any): T {
    if (err || !user) {
      // 'info' often holds the underlying reason: TokenExpiredError, JsonWebTokenError, etc.
      throw new UnauthorizedException(info?.message ?? 'Invalid or expired token');
    }
    return user;
  }
}

// Usage on a controller
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user; // set by JwtStrategy.validate()
    return this.roomsService.findByUser(user.id);
  }
}
```

### Custom @CurrentUser Decorator

Instead of extracting `req.user` manually, create a parameter decorator:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // If data is specified, return only that property (e.g., @CurrentUser('id'))
    return data ? user?.[data] : user;
  },
);

// Usage
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: UserPayload) {
  return user;
}

@Get('my-rooms')
@UseGuards(JwtAuthGuard)
getMyRooms(@CurrentUser('id') userId: string) {
  return this.roomsService.findByUser(userId);
}
```

### RBAC Basics (Role-Based Access Control)

RBAC restricts access based on the user's role. Common approach: a custom guard + decorator.

```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Decorator to set allowed roles on a route
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Guard that checks if user has the required role.
// Run AFTER JwtAuthGuard so request.user is already set.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true; // no roles required = public

    const { user } = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(user.role)) {
      // 401 = "who are you?" (handled by JwtAuthGuard).
      // 403 = "we know you, but you can't do this" — use Forbidden here.
      throw new ForbiddenException(`Required roles: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
}

// Usage
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
deleteRoom(@Param('id') id: string) {
  return this.roomsService.delete(id);
}
```

## Learn More

- [bcrypt npm](https://www.npmjs.com/package/bcrypt)
- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)
- [JWT.io](https://jwt.io/) — decode and inspect JWTs
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS Authorization](https://docs.nestjs.com/security/authorization)
- [Passport.js](http://www.passportjs.org/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## How to Work

### One-time setup

`bcrypt`, `jsonwebtoken`, and their TypeScript types are listed in the **root `package.json`** of this repo. If you haven't run `npm install` at the repo root recently, do it now:

```bash
npm install                 # from the repo root
```

This pulls in `bcrypt`, `jsonwebtoken`, `@types/bcrypt`, and `@types/jsonwebtoken`. Without these, the examples will fail with `TS7016: Could not find a declaration file for module 'bcrypt'`.

> The NestJS-specific dependencies (`@nestjs/passport`, `@nestjs/jwt`, `passport`, `passport-jwt`) are installed **inside `santa-api`** as part of the App Task — not at the repo root.

### Run

1. **Study examples**:
   ```bash
   npx ts-node src/04-backend/lessons/08-authentication/examples/bcrypt-example.ts
   npx ts-node src/04-backend/lessons/08-authentication/examples/jwt-example.ts
   ```
   The NestJS-specific examples (`passport-jwt-strategy.ts`, `auth-guard.ts`) are meant to be read and understood, then applied in the App Task.

2. **Complete exercises**:
   ```bash
   npx ts-node src/04-backend/lessons/08-authentication/exercises/auth-flow.ts
   npx ts-node src/04-backend/lessons/08-authentication/exercises/rbac.ts
   ```

3. **Complete the App Task** below.

## App Task

See [exercises/app-task.md](exercises/app-task.md) — build an `AuthModule` in santa-api with register/login endpoints, JWT-based route protection, a `@CurrentUser()` decorator, and replace the `passwordHash: 'TODO_LESSON_08'` placeholder from Lesson 07.
