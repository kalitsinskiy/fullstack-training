# Testing santa-api — the approach

We test the API as **component (HTTP) tests**, not isolated unit tests with
everything mocked. Each test boots the real `AppModule` against an **in-memory
MongoDB** and drives it over real HTTP with `supertest`. A request flows through
the same path as production — `ValidationPipe → JwtAuthGuard → controller →
service → Mongo` — so the test proves the pieces work *together*.

Why this style: it catches the bugs that matter (wiring, guards, validation,
DB queries, serialization) without the brittleness of mocking Mongoose. It's the
same approach you used in Block 04's testing lesson, here applied per feature.

## Layout

Tests live in **`test/`**, never next to the source files. One spec per feature
area, named `*.e2e-spec.ts` (picked up by `jest-e2e.json`).

```
test/
  global-setup.ts       # starts the in-memory Mongo ONCE, before any import (provided)
  global-teardown.ts    # stops it after the whole run (provided)
  setup-mongo.ts        # exposes the URI to specs + clearAllCollections (provided)
  auth-token.helper.ts  # tokenFor(jwt, user) → a signed JWT (provided)
  factories.ts          # userFixture / roomFixture (provided)
  auth.e2e-spec.ts      # 1 worked example + it.todo scenarios
  rooms.e2e-spec.ts     # 1 worked example + it.todo scenarios
  …                     # add wishlist / users specs the same way
```

### Why a *global* setup (a real gotcha)

`AppModule` wires `ConfigModule.forRoot({ validationSchema })`, which validates —
and **snapshots** — `MONGO_URL` / `JWT_SECRET` the instant the module is
*imported*. A spec's `beforeAll` runs after that import, so starting Mongo there
is too late: the app fails to build with `"MONGO_URL" is required`. That's why
the in-memory Mongo is started in **`global-setup.ts`** (Jest runs it before any
test file loads) and the URI is published on `process.env`. With `--runInBand`
the specs share that process, so the value is in place at import time.

The harness (`global-setup`, `setup-mongo`, `factories`, `auth-token.helper`) is given to you.
The specs ship with **one worked example each** (green against the skeleton,
because validation/guards run before the service) plus an `it.todo(...)` list of
the scenarios to cover. As you implement each service, turn the todos into real
tests. The lists are a floor — add edge cases you discover.

## What to test (per feature)

- **Happy path** — the documented success response (status + body shape).
- **Validation** — missing/invalid fields return `400` from the `ValidationPipe`.
- **Auth** — protected routes return `401` without a token.
- **Authorization** — non-members/`non-creators` are rejected (`403`).
- **Domain rules** — invite-code mismatch (`400`), draw twice / too few
  participants, draw produces a derangement (nobody gets themselves), the
  generic-`401` rule for login (same message for wrong password and unknown email).

## How to write one

1. Copy the `beforeAll/beforeEach/afterEach/afterAll` harness from a worked example.
2. Seed state with the factories (`userModel.create(userFixture(...))`) and mint a
   token with `tokenFor(jwt, user)`; send it as `Authorization: Bearer <token>`.
3. Drive the endpoint with `supertest` and assert **status + body** with
   `.expect(...)` / `toMatchObject(...)`.
4. `clearAllCollections` runs between tests, so each test starts from a clean DB.

## Run

```bash
npm run test:e2e
```
