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

### 3.0 Get the template

The starter code lives in [`template/`](template/) (see its
[`README.md`](template/README.md)). Copy it to your repo root, then run from
there:

```bash
cp -R src/06-fullstack/lessons/00-kickoff/template/. .
# → santa-api/, santa-notifications/, santa-app/, docker-compose.yml now at root
```

(Or keep your own Block-04 backend and copy only `template/santa-app` — see §4.)

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

Create your first account, then sign in at http://localhost:5173/login — the
**LoginPage is the worked example** and talks to `santa-api`, so you'll land on
the (stub) rooms dashboard.

> To create that first account, use the API directly (the `RegisterPage` is a
> stub you build later): open Swagger at http://localhost:3001/docs and call
> `POST /api/auth/register`, or:
> ```bash
> curl -X POST http://localhost:3001/api/auth/register \
>   -H 'Content-Type: application/json' \
>   -d '{"email":"you@example.com","password":"Passw0rd!","displayName":"You"}'
> ```

---

## 4. Choose your starting point

The [`template/`](template/) folder beside this lesson holds the **recommended
template** — a unified, tested baseline: a contract-faithful backend (auth,
rooms, wishlists, the draw + assignment endpoints, an e2e suite) plus the React
frontend scaffold. It lives under the lesson (not at the repo root) so it never
conflicts with your own folders on `git pull` — you copy out what you want.

| Option | What you do |
|--------|-------------|
| **Use the template** (recommended) | `cp -R …/template/. .` then build features on top, lesson by lesson |
| **Cherry-pick** | Copy only parts, e.g. our `santa-app` baseline + your own Block-04 backend |
| **Keep your own** | Ignore the template; build on your Block-04 work, using this as a reference |

Nothing is mandatory — the template unblocks you, it doesn't replace your work.
See [`template/README.md`](template/README.md) for copy/run details.

> Either way, the **API contract** is the source of truth:
> [`template/santa-api/docs/api-contract.md`](template/santa-api/docs/api-contract.md),
> mirrored by `santa-app/src/types/api.ts`.

---

## 5. How this block works

Each lesson adds one capability across the stack. No separate exercises — the
**app is the exercise**.

| # | Lesson | You build |
|---|--------|-----------|
| 00 | Kickoff (this) | Stack running, starting point chosen |
| 01 | Docker & Infrastructure | Dockerfiles, full compose stack |
| 02 | Environment & Config | Typed env for all three apps |
| 03 | Rooms & Draw | Derangement, transaction, room + draw UI |
| 04 | Redis | Caching, TTL invite codes, rate limiting |
| 05 | RabbitMQ | Event publish/consume between services |
| 06 | Notifications | HTTP inter-service calls, notifications UI |
| 07 | WebSockets | Real-time push, `useSocket`, toasts |
| 08 | Anonymous Messaging | Mediator relay, chat UI |
| 09 | Testing Microservices | Cross-service + Playwright E2E |
| 10 | CI/CD & Deployment | Local hooks + manual deploy to free tiers |

## How to work

1. Read the lesson **README.md** — understand the new concept.
2. Follow the **step-by-step task** — implement the feature in the real apps,
   matching the mockups.
3. Test it — run the apps; verify with curl/Postman/browser.
4. Commit your progress.
