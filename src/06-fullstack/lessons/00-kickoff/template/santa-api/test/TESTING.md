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
  setup-mongo.ts        # in-memory Mongo lifecycle + clearAllCollections (provided)
  auth-token.helper.ts  # tokenFor(jwt, user) → a signed JWT (provided)
  factories.ts          # userFixture / roomFixture (provided)
  auth.e2e-spec.ts      # 1 worked example + it.todo scenarios
  rooms.e2e-spec.ts     # 1 worked example + it.todo scenarios
  …                     # add wishlist / users specs the same way
```

The harness (`setup-mongo`, `factories`, `auth-token.helper`) is given to you.
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
