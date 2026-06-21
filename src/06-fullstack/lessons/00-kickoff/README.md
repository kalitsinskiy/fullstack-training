# Lesson 00: Kickoff

## Quick Overview

Welcome to the Fullstack block. Until now you built backend pieces in isolation
(Block 04) and learned React in isolation (Block 05). Here you tie everything
into one real, deployable product: **Secret Santa** — create a room, invite
friends, draw names fairly, set wishlists, chat anonymously with your match, and
get real-time notifications.

This lesson has no new framework to learn. It is the on-ramp: understand the
app, get the three projects running together, and pick your starting point.

By the end of this lesson you will have:

- The whole stack running locally (infra in Docker, three apps connected)
- A clear picture of what you're building and which lesson builds what
- Your `santa-app` frontend booting against a working backend
- A decision made: use the recommended template, or keep your own backend

---

## 1. The App

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────────┐
│  santa-app  │────▶│    santa-api      │────▶│  santa-notifications  │
│  React SPA  │     │  NestJS :3001     │     │  Fastify :3002        │
│  :5173      │     │  Auth, Rooms,     │     │  Notifications,       │
│             │     │  Wishlists, Draw  │     │  Anon messages, WS    │
└─────────────┘     └────────┬─────────┘     └───────────┬───────────┘
                             │                           │
                    ┌────────┴───────────────────────────┴──────────┐
                    │  MongoDB :27017   Redis :6379   RabbitMQ :5672 │
                    └────────────────────────────────────────────────┘
```

| Project | Stack | Role |
|---------|-------|------|
| `santa-api` | NestJS + MongoDB | Auth, rooms, wishlists, the draw |
| `santa-notifications` | Fastify + MongoDB | Notifications, anonymous messages, WebSocket push |
| `santa-app` | React + Vite + Tailwind + shadcn/ui | The UI you build from the mockups |

---

## 2. The design — build the UI from mockups

You are **not** handed a finished frontend. You get structure, an approach, and
**Figma mockups** to implement.

- **Mockups:** [`template/santa-app/docs/mockups/`](template/santa-app/docs/mockups/) —
  all 8 screens, mobile **and** desktop, in the Santa-warm theme (PNG, plus the
  [Figma file](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR)).
- **Design system:** [`template/santa-app/docs/design-system.md`](template/santa-app/docs/design-system.md) +
  [`design-tokens.json`](template/santa-app/docs/design-tokens.json) —
  exact colors, typography, spacing, radii, component sizes, breakpoints. These
  map 1:1 to the CSS variables in `santa-app/src/index.css`.

> **You don't need Figma Dev Mode** (it's paid). All exact values are in
> `design-system.md` / `design-tokens.json`; the PNGs give you the layout. On a
> free Figma account you can still click a layer to see its Design-panel
> properties. If you *do* have Dev Mode, use it — same tokens.
- **Worked example:** `santa-app/src/pages/LoginPage.tsx` is the one fully-built
  screen. Study it — tokens + shadcn components, an axios call through `api`,
  errors via `toast`, auth via `useAuth`, routing. Every other page is a stub
  with `TODO(...)` markers; you build them the same way, matching the mockups.

> Responsive contract: **mobile** = top bar + bottom tab nav; **desktop** =
> left sidebar + main content. The shell (`AppLayout` → `Sidebar` on `md+`,
> `BottomNav` below) is already wired.

---

## 3. Run the whole stack

**Prerequisites:** Node 20+, Docker Desktop, a terminal.

### 3.0 Get the template — overlay it onto your root projects

[`template/`](template/) holds the **recommended fullstack files**. You don't
work *inside* `template/` — it's the source you copy from. Copy (overlay) its
contents **onto the `santa-api/` / `santa-notifications/` / `santa-app/` projects
that already live at your repo root** — the same projects you've grown since
Block 04. The overlay adds the fullstack scaffolding (package.json, `src/`,
configs, the frontend, `docker-compose.yml`) on top of your Block-04/05 work; it
doesn't erase your earlier `examples/` and `exercises/`.

From the repo root:

```bash
T=src/06-fullstack/lessons/00-kickoff/template
cp -R "$T/santa-api/."            santa-api/
cp -R "$T/santa-notifications/."  santa-notifications/
cp -R "$T/santa-app/."            santa-app/
cp    "$T/docker-compose.yml"     docker-compose.yml   # replaces the older root compose
```

> Copy only the projects + `docker-compose.yml` above — **not** `template/`'s own
> `README.md` (that would clobber the repo's root README). You can re-run these
> copies any time to refresh against the recommended baseline. Then
> `npm install` in each project.

(Or keep your own Block-04 backend and overlay only `template/santa-app` — see §5.)

### 3.1 Infrastructure (Docker)

From the repo root, the template's `docker compose` brings up the whole backend —
mongo/redis/rabbitmq **plus** `santa-api` and `santa-notifications`:

```bash
docker compose up --build   # infra + both backends (santa-api :3001, santa-notifications :3002)
docker compose ps           # infra "healthy", backends "Up"
```

While actively developing a backend you'll usually want hot-reload instead —
run only the infra in Docker and the service locally:

```bash
docker compose up -d mongodb redis rabbitmq   # infra only (:27017 / :6379 / :5672 + :15672 UI)
```

(In Lesson 01 you study this backend Docker setup and Dockerize the frontend yourself.)

### 3.2 Backends

```bash
# Terminal 1
cd santa-api && npm install && cp .env.example .env && npm run start:dev   # :3001

# Terminal 2
cd santa-notifications && npm install && cp .env.example .env && npm run dev # :3002
```

### 3.3 Frontend

```bash
# Terminal 3
cd santa-app && npm install && cp .env.example .env && npm run dev          # :5173
```

All three apps now **boot**, but the API is a **skeleton**: every service method
throws `501 Not Implemented`. So registering or logging in fails until you do the
bootstrap below. That's intentional — the template hands you the structure
(controllers, DTOs, schemas, the API contract, tests), and you write the logic.

---

## 4. Bootstrap the base backend (your first task)

Before any feature lesson, make the **base API real**. This is the CRUD you
already built in Block 04 — re-implement it here against the provided structure.
Open each stubbed service and replace the `throw new NotImplementedException(...)`
bodies (each has a `TODO` describing what it should do):

| Service | Methods to implement | Leave for later |
|---|---|---|
| `auth/auth.service.ts` | `register`, `login` (bcrypt hash/compare, sign JWT) | — |
| `users/users.service.ts` | `create`, `findByEmail`, `findById`, `updateCurrentUser` | — |
| `rooms/rooms.service.ts` | `create`, `findByUser`, `findByIdForUser`, `join` | `draw`, `getAssignment` → **Lesson 03** |
| `wishlist/wishlist.service.ts` | `set`, `get` | — |

**Your spec, three sources that agree:**
- `santa-api/docs/api-contract.md` — every endpoint's request/response shape.
- The `TODO` comment on each stub — what that method must do.
- The tests — `cd santa-api && npm run test:e2e`. One example per file is green;
  the rest are `it.todo(...)`. Turn each todo into a real test as you implement,
  and watch them go green. (See `santa-api/test/TESTING.md`.)

**Verify the bootstrap works:**

```bash
# Register, then log in — both should now succeed (201 / 200 + a token):
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"Passw0rd!","displayName":"You"}'
```

Then sign in at http://localhost:5173/login (the **LoginPage is the worked
example**) — you should land on the rooms dashboard and be able to create a room.

> The `RegisterPage` UI is itself a stub you build later from the mockups; for now
> Swagger (http://localhost:3001/docs) or the curl above creates your first user.

### Stretch — unique room names per creator (optional improvement)

Right now nothing stops one user from creating several rooms all called
"Office Santa" — confusing when they open their dashboard. Make a room name
**unique per creator** (different users may still reuse the same name):

- Add a compound unique index in `room.schema.ts`:
  `RoomSchema.index({ creatorId: 1, name: 1 }, { unique: true })`.
- In `RoomsService.create`, catch the duplicate-key error (Mongo `code === 11000`)
  and throw `ConflictException` → the API returns **409** instead of a 500.
- Trim the name before saving. (Optional: make it case-insensitive with a
  collation `{ locale: 'en', strength: 2 }` on the index so "Office" and "office"
  collide too.)
- Document the new `409` on `POST /rooms` and turn the `it.todo` for it green.

This is scoped to ONE creator on purpose — it's a UX guard against your own
duplicates, not a system-wide name reservation.

> ⚠️ Gotcha: a unique index will **silently fail to build** if the collection
> already contains duplicates — Mongoose `autoIndex` swallows the error, so the
> constraint just appears not to work. Remove existing duplicates first, then
> confirm the index exists (`db.rooms.getIndexes()`); in code you can force a
> rebuild with `RoomModel.syncIndexes()`.

---

## 5. Choose your starting point

The [`template/`](template/) folder beside this lesson holds the **recommended
skeleton** — the structure to build on: controllers, DTOs, Mongoose schemas, the
API contract, a frontend scaffold (with `LoginPage` as the one worked example),
and a test harness with worked examples + `it.todo` lists. Service logic is
stubbed (you implement it, starting with §4). It lives under the lesson (not at
the repo root) so it never conflicts with your own folders on `git pull` — you
copy out what you want.

| Option | What you do |
|--------|-------------|
| **Use the template** (recommended) | Overlay it onto your root `santa-*` projects (§3.0), implement §4, then build features lesson by lesson |
| **Cherry-pick** | Overlay only parts, e.g. our `santa-app` baseline + your own Block-04 backend |
| **Keep your own** | Ignore the template; build on your Block-04 work, using this as a reference |

Nothing is mandatory — the template unblocks you, it doesn't replace your work.
See [`template/README.md`](template/README.md) for copy/run details.

> Whichever option you pick, copy the template's `docker-compose.yml` to the repo
> root — the older root compose has both backends commented out and stale images.

> Either way, the **API contract** is the source of truth:
> [`template/santa-api/docs/api-contract.md`](template/santa-api/docs/api-contract.md),
> mirrored by `santa-app/src/types/api.ts`.

---

## 6. How this block works

Each lesson adds one capability across the stack. No separate exercises — the
**app is the exercise**.

| # | Lesson | You build |
|---|--------|-----------|
| 00 | Kickoff (this) | Stack running, base backend bootstrapped (§4), starting point chosen |
| 01 | Docker & Infrastructure | Dockerfiles, full compose stack |
| 02 | Environment & Config | Typed env for all three apps |
| 03 | Rooms & Draw | Derangement, single-document atomic draw, room + draw UI |
| 04 | Authorization: Roles & Permissions | Owner/member roles, permission guard, owner-only endpoints, FE gating |
| 05 | Redis | Caching, TTL invite codes, rate limiting |
| 06 | RabbitMQ | Event publish/consume between services |
| 07 | Notifications | HTTP inter-service calls, notifications UI |
| 08 | WebSockets | Real-time push, `useSocket`, toasts |
| 09 | Anonymous Messaging | Mediator relay, chat UI |
| 10 | Testing Microservices | Cross-service + Playwright E2E |
| 11 | CI/CD & Deployment | Local hooks + manual deploy to free tiers |

## How to work

1. Read the lesson **README.md** — understand the new concept.
2. Follow the **step-by-step task** — implement the feature in the real apps,
   matching the mockups.
3. Test it — run the apps; verify with curl/Postman/browser.
4. Commit your progress.
