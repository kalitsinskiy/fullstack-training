# App Task: Tests for santa-api

Cover the most important paths in santa-api with **unit tests** (mocked Mongoose models) and **integration tests** (real in-memory MongoDB + supertest). By the end, `npm test` in `santa-api` runs green and a regression in `RoomsService.draw()` or `AuthService.login()` would actually fail CI.

> Prerequisites: santa-api with AuthModule (Lesson 08), pagination + Helmet + rate-limit (Lesson 09).

---

## 1. Install test dependencies in santa-api

`@nestjs/testing` is already pulled in by the NestJS scaffolding. You need:

```bash
cd santa-api
npm install -D supertest @types/supertest mongodb-memory-server
```

> The same packages are in the **repo root** for the lesson examples — don't confuse the two installs. santa-api needs its own copy because Jest runs from the santa-api workspace.

---

## 2. Test directory layout

Use **co-located** specs for unit tests (next to the source file) and a **separate `test/`** folder for integration tests — that's the NestJS convention:

```
santa-api/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts          ← unit, mocked deps
│   │   └── ...
│   ├── rooms/
│   │   ├── rooms.service.ts
│   │   ├── rooms.service.spec.ts         ← unit, mocked Mongoose
│   │   └── ...
└── test/
    ├── setup-mongo.ts                    ← in-memory MongoDB for integration
    ├── factories.ts                      ← test data builders
    ├── auth-token.helper.ts              ← issue JWTs in tests
    ├── auth.e2e-spec.ts                  ← integration
    ├── rooms.e2e-spec.ts                 ← integration
    └── jest-e2e.json                     ← separate config
```

The default NestJS scaffold already ships a `test/jest-e2e.json`. Edit it to point at your `setup-mongo.ts`.

---

## 3. In-memory MongoDB setup

`test/setup-mongo.ts`:

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

export async function startInMemoryMongo(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  return mongoServer.getUri();
}

export async function stopInMemoryMongo(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function clearAllCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
```

### Refactor `AppModule` first

Lesson 07 wired Mongoose with `MongooseModule.forRoot(process.env.MONGO_URL ?? '...')`. That hardcodes the URI at module-evaluation time — there's nothing for a test to override. Switch it to `forRootAsync` with `useFactory`, so the URI is supplied at module-construction time:

```typescript
// src/app.module.ts
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URL ?? 'mongodb://localhost:27017/santa-api',
      }),
    }),
    // ...
  ],
})
export class AppModule {}
```

That's all the production change you need. The test bootstrap then *replaces* the `MongooseModule` import with one pointing at the memory server.

### Wire the in-memory Mongo into a test module

```typescript
// test/auth.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { startInMemoryMongo, stopInMemoryMongo, clearAllCollections } from './setup-mongo';

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const uri = await startInMemoryMongo();

    const moduleRef = await Test.createTestingModule({
      // Import AppModule, then override its Mongoose connection by re-importing
      // MongooseModule with the memory-server URI. The last forRootAsync wins.
      imports: [
        AppModule,
        MongooseModule.forRoot(uri),
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    // Wipe collections between tests so they don't leak state.
    await clearAllCollections();
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  // ... tests
});
```

> **Don't change `process.env.MONGO_URL` from inside a test** — it leaks across test files (each Jest worker shares the env), and the AppModule's factory may have already been evaluated by the time you set it.

> **`jest --runInBand`**: each Jest worker would otherwise start its own `MongoMemoryServer` and they'd race to download the binary on first run. Either run integration tests serially (`--runInBand`) or pre-warm the binary in CI.

---

## 4. Test factories

`test/factories.ts`:

```typescript
import { Types } from 'mongoose';

let counter = 0;
const uniq = () => `${Date.now()}-${counter++}`;

export const userFixture = (overrides: Partial<any> = {}) => ({
  _id: new Types.ObjectId(),
  email: `user-${uniq()}@test.com`,
  displayName: 'Test User',
  passwordHash: '$2b$10$placeholder',
  role: 'user',
  ...overrides,
});

export const roomFixture = (overrides: Partial<any> = {}) => ({
  _id: new Types.ObjectId(),
  name: 'Test Room',
  inviteCode: uniq().slice(-6).toUpperCase(),
  creatorId: new Types.ObjectId(),
  participants: [],
  status: 'pending',
  ...overrides,
});
```

Always use `uniq()`-style helpers for fields with a unique index (`email`, `inviteCode`) — otherwise tests that run after `clearAllCollections()` can still race within the same `describe` block.

---

## 5. JWT helper for protected routes

`test/auth-token.helper.ts`:

```typescript
import { JwtService } from '@nestjs/jwt';

// Sign a JWT using the same secret as the app — read it from the test config.
// Generating tokens directly (rather than calling POST /auth/login each time)
// keeps integration tests fast and isolated from the auth flow itself.
export function tokenFor(jwt: JwtService, user: { _id: string; email: string; role?: string }) {
  return jwt.sign({
    sub: user._id.toString(),
    email: user.email,
    role: user.role ?? 'user',
  });
}
```

Use it in tests:

```typescript
const jwt = app.get(JwtService);
const user = await userModel.create(userFixture({ email: 'alice@test.com' }));
const token = tokenFor(jwt, user);

const res = await request(app.getHttpServer())
  .get('/api/rooms')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

Reserve `POST /auth/login` for one or two tests that *specifically* verify the login endpoint — every other test should bypass it by signing a JWT directly, so login latency (bcrypt is intentionally slow) doesn't dominate the suite.

---

## 6. Required tests

### 6.1 Unit — `RoomsService` (`src/rooms/rooms.service.spec.ts`)

Mock the Mongoose model with `jest.fn()`s for each method. Cover:

- `create()` — generates a 6-char invite code, sets `creatorId`, includes the creator in `participants`, status `'pending'`.
- `findById()` — returns the room, or throws `NotFoundException` when the model returns `null`.
- `join()` — adds the user to `participants` (uses `$addToSet`); duplicate joins are no-ops; rejects with `ForbiddenException` if `status === 'drawn'`.
- `draw()` — assigns Secret Santas; throws `BadRequestException` if `participants.length < 3`; flips status to `'drawn'`.

### 6.2 Unit — `AuthService` (`src/auth/auth.service.spec.ts`)

Mock `UsersService` and `JwtService` via DI. `bcrypt` is imported directly (not injected), so mock the module:

```typescript
jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
// ... mockBcrypt.hash.mockResolvedValue('$hash' as never);
// ... mockBcrypt.compare.mockResolvedValue(true as never);
```

Cover:

- `register()` — calls `bcrypt.hash` (assert it was called, not what hash was produced); rejects duplicate email with `ConflictException`; returns `{ id, email, displayName, accessToken }`.
- `login()` — happy path with valid credentials; rejects with `UnauthorizedException('Invalid credentials')` for wrong password **and** for non-existent email — both with the **same message** (the generic-error rule from Lesson 08 that defends against email enumeration).

### 6.3 Integration — auth (`test/auth.e2e-spec.ts`)

- `POST /api/auth/register`: 201 + accessToken; 400 on missing fields; 409 on duplicate email.
- `POST /api/auth/login`: 200 + accessToken on valid creds; 401 with the same generic message for both wrong password and unknown email.

### 6.4 Integration — rooms (`test/rooms.e2e-spec.ts`)

- `POST /api/rooms` with token → 201 + room body.
- `POST /api/rooms` without token → 401.
- `GET /api/rooms?page=1&limit=2` → 200 with `{ data, meta }` (Lesson 09 pagination shape).
- `GET /api/rooms/:id` for someone else's room → 403 or 404 (whichever your service throws).

### 6.5 Optional — santa-notifications

Same in-memory Mongo + supertest pattern (with raw Fastify; use `app.inject(...)` if you prefer over supertest). Cover create/list/markAsRead/delete.

---

## 7. Jest scripts in santa-api/package.json

```json
{
  "scripts": {
    "test":              "jest",
    "test:watch":        "jest --watch",
    "test:cov":          "jest --coverage",
    "test:e2e":          "jest --config ./test/jest-e2e.json --runInBand",
    "test:e2e:cov":      "jest --config ./test/jest-e2e.json --runInBand --coverage"
  }
}
```

`--runInBand` is intentional for `test:e2e` — see Section 3.

---

## 8. Coverage thresholds

In the **unit** Jest config — either the `jest` field in `package.json` (the NestJS scaffold puts it there) or a separate `jest.config.js`:

```javascript
// jest.config.js (or `"jest": {...}` in package.json — same shape minus the surrounding `module.exports =`)
module.exports = {
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  collectCoverageFrom: ['src/**/*.{ts,js}', '!src/**/*.spec.ts', '!src/main.ts'],
};
```

Don't set integration-test coverage thresholds — they aren't a meaningful number (most lines are covered by definition when you exercise the HTTP layer, even if a branch is never asserted). Coverage thresholds belong on unit tests where coverage actually reflects what was *checked*.

---

## 9. Final verification checklist

- [ ] `cd santa-api && npm test` → all unit tests pass.
- [ ] `cd santa-api && npm run test:e2e` → integration tests pass against in-memory Mongo.
- [ ] First `test:e2e` run downloads MongoDB binary (~100 MB to `~/.cache/mongodb-binaries`); subsequent runs are fast.
- [ ] Coverage threshold met for unit tests (`npm run test:cov`).
- [ ] Deliberately break `RoomsService.draw()` (e.g. comment out the participant count check) → at least one test fails.
- [ ] Deliberately break `AuthService.login()` (e.g. return a token even on wrong password) → at least one test fails.

## What you have now

A santa-api with regression coverage on the auth and rooms flows. Your CI can now reject PRs that break these paths. Lesson 11+ (frontend) will start building against this same API; the integration tests are what protect the contract.
