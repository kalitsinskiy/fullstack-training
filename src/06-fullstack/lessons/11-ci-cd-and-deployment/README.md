# Lesson 11: CI/CD and Deployment

## Quick Overview

Code that isn't deployed delivers no value. This final lesson puts a quality gate
in front of your code and ships the app to the internet.

- **CI is local.** A `pre-push` hook (Husky) runs lint + type-check + tests for
  all three apps before anything leaves your machine. We deliberately **don't**
  add a hosted pipeline (e.g. GitHub Actions): in this course everyone learns in
  **one shared repo**, so a workflow on the shared `main` would run for everyone
  and share secrets. Your local gate **is** your CI.
- **Deploy with Infrastructure as Code.** A single **`render.yaml`** Blueprint
  declares all three services on **Render**, backed by managed **MongoDB Atlas**,
  **Redis Cloud**, and **CloudAMQP**. Deploys are **manual** — the repo holds the
  _definition_ of prod, you hold the _trigger_ and the _secrets_.

> **The template already ships the CI gate + IaC** — `package.json` (root),
> `.husky/`, `commitlint.config.js`, `.lintstagedrc.mjs`, and `render.yaml`.
> Your job: understand them, then provision **your own** free-tier accounts and
> deploy. Secrets are **never** committed — you set them in the platform.

---

## Key Concepts

### Why CI stays local (for now)

A hosted pipeline (GitHub Actions, GitLab CI) lives on one repo's settings and
secrets. This course runs in a **single shared learning repo**, so a workflow on
the shared `main` would fire for everyone's pushes and would need shared cloud
secrets — a bad fit. Instead, the **`pre-push` hook is the CI**: it runs the same
lint → type-check → test gate locally, in seconds, for each student independently.

> If you later move to your **own** repo, these exact commands lift straight into
> a GitHub Actions workflow (one job per app, `npm ci && npm run lint &&
npm run type-check && npm test`) — but that's out of scope here.

### Deploying from a shared repo (each student, isolated)

This course runs in **one shared repo**, but everyone deploys **independently**.
The trick: a Render **Blueprint binds to a Render account, not to the repo** — the
repo is just the `render.yaml` template Render reads.

- **Each student uses their own Render account** + their own Atlas / Redis /
  CloudAMQP. You each get your own services and URLs (`santa-api-xxxx`,
  `santa-api-yyyy`, …) — fully isolated, nobody overwrites anyone.
- **Don't share one Render workspace** for everyone: `render.yaml` sets
  `name: santa-api`, and two services can't share a name in one workspace.
- **`autoDeploy: false`** means a teammate's `git push` to the shared `main`
  never triggers your deploy — you deploy manually, when you choose.
- **Repo access:** if the repo is private, each student needs read access + the
  Render GitHub App authorized on it. Simplest for a class: make the repo
  **public** (Render deploys any public Git URL, no access grants needed).
- **`render.yaml` must sit at the repo root**, next to `santa-api/`,
  `santa-notifications/`, and `santa-app/` — that's how the Docker paths resolve.

### Git Hooks with Husky (shipped)

Git hooks are scripts Git runs at lifecycle points. **Husky** manages them in a
committed `.husky/` directory. The root `package.json` has a `prepare` script:

```json
{ "scripts": { "prepare": "husky" } }
```

so `npm install` at the repo root activates the hooks (it sets
`core.hooksPath=.husky`). The three shipped hooks:

- **`pre-commit`** → `npx lint-staged` — lints only your staged files.
- **`commit-msg`** → `npx --no -- commitlint --edit "$1"` — validates the message.
- **`pre-push`** → the full lint + type-check + test gate (see below).

A failing hook exits non-zero and aborts the commit/push.

### lint-staged in a monorepo (shipped)

Each app has its **own** ESLint config (type-aware rules rooted at that app), so
you can't lint from the repo root. `.lintstagedrc.mjs` `cd`s into the app and
lints just the staged files:

```js
import path from 'node:path';
const appScoped = (app) => (files) => {
  const rel = files.map((f) => path.relative(app, f)).join(' ');
  return `bash -c 'cd ${app} && npx eslint --fix ${rel}'`;
};
export default {
  'santa-api/**/*.ts': appScoped('santa-api'),
  'santa-notifications/**/*.ts': appScoped('santa-notifications'),
  'santa-app/**/*.{ts,tsx}': appScoped('santa-app'),
};
```

### Conventional Commits (commitlint, shipped)

`commitlint.config.js` enforces `<type>(<scope>): <subject>`:

| Type       | When                                   |
| ---------- | -------------------------------------- |
| `feat`     | new feature                            |
| `fix`      | bug fix                                |
| `docs`     | documentation only                     |
| `style`    | formatting (no code change)            |
| `refactor` | neither fixes a bug nor adds a feature |
| `test`     | tests                                  |
| `chore`    | tooling / deps                         |
| `ci`       | CI/CD config                           |
| `perf`     | performance                            |

```bash
git commit -m "feat(rooms): add gift budget"   # ✓ passes
git commit -m "update stuff"                    # ✗ rejected
```

### The pre-push gate — your CI (shipped)

`.husky/pre-push`:

```bash
set -e
for app in santa-api santa-notifications santa-app; do
  echo "▶ CI: $app"
  ( cd "$app" && npm run lint && npm run type-check && npm test )
done
```

```
  git push
     |
     v
  pre-push hook (local CI)
     +── lint ──────────┐
     +── type-check ────┤  per app: santa-api, santa-notifications, santa-app
     +── test ──────────┘
     |
  all green → push proceeds   |   any red → push aborted
```

There's also a convenience `npm run ci` at the repo root that runs the same loop.

> **What's in the gate, and what isn't.** The gate runs each app's `npm test`.
> The backend suites use `mongodb-memory-server`, which **downloads a MongoDB
> binary on the first run** (cached afterwards) — so your first push is slower.
> The **Playwright** end-to-end flow (`santa-app npm run test:e2e`) needs the
> whole stack up, so it is deliberately **not** in the gate — run it by hand
> before a deploy.

### Infrastructure as Code — `render.yaml` (shipped)

Instead of clicking through a dashboard, the entire stack is declared once in
`render.yaml` (a [Render Blueprint](https://render.com/docs/blueprint-spec)).
Render reads it and provisions everything:

- **santa-api** — Docker web service, health check `/api/health`.
- **santa-notifications** — Docker web service, health check `/health`.
- **santa-app** — static site (Vite build → static hosting) with an SPA rewrite.
- **`santa-shared` env group** — `JWT_SECRET` + `SERVICE_API_KEY`, **generated
  once** by Render and shared by both backends (they must match: notifications
  verifies santa-api's JWTs and calls its `/internal/*` with the service key).

Connection strings (`MONGO_URL`, `REDIS_URL`, `RABBITMQ_URL`) and cross-service
URLs (`CORS_ORIGIN`, `SANTA_API_URL`, `VITE_API_URL`, `VITE_WS_URL`) are marked
`sync: false` — **placeholders you fill in the dashboard**, never committed.
`autoDeploy: false` keeps deploys manual.

### Managed services (free tier)

| Service  | Provider          | Free tier    | In-transit security                 |
| -------- | ----------------- | ------------ | ----------------------------------- |
| MongoDB  | **MongoDB Atlas** | M0, 512 MB   | TLS by default (`mongodb+srv://`)   |
| Redis    | **Redis Cloud**   | 30 MB        | free tier is plaintext (`redis://`) |
| RabbitMQ | **CloudAMQP**     | Little Lemur | TLS (`amqps://`)                    |

> **Prefer TLS.** `mongodb+srv` and `amqps://` are TLS by default — keep them.
> (Redis Cloud's free tier is plaintext `redis://`, which is fine for this
> training app's non-sensitive data; a real service would require TLS in transit.)

### Environment variables & secrets

**Never commit secrets.** `.env` is gitignored; commit only `.env.example`.
In prod, secrets live in the platform:

- **Generated** (`JWT_SECRET`, `SERVICE_API_KEY`) — Render creates them in the
  `santa-shared` group; you never see or paste them.
- **From your providers** (`MONGO_URL`, `REDIS_URL`, `RABBITMQ_URL`) — paste the
  connection strings into Render (`sync: false` vars).
- **Public, build-time** (`VITE_API_URL`, `VITE_WS_URL`) — baked into the SPA
  bundle at build, so they are **not** secret (only public URLs go here).

### Health checks

Both backends expose a health endpoint Render pings to know the service is up:

```ts
// santa-api  → GET /api/health
@Get('health')
healthCheck() {
  return { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };
}
```

```ts
// santa-notifications → GET /health  (Fastify)
fastify.get('/health', async () => ({ status: 'ok' }));
```

### Deployment checklist

- [ ] CI gate green locally (`npm run ci`, or just `git push`)
- [ ] No hardcoded secrets; `.env` gitignored, only `.env.example` committed
- [ ] Mongo + RabbitMQ use TLS (`mongodb+srv`, `amqps`)
- [ ] `CORS_ORIGIN` set to the deployed santa-app URL on both backends
- [ ] `JWT_SECRET` + `SERVICE_API_KEY` identical across both backends
- [ ] Health checks respond (`/api/health`, `/health`)
- [ ] `NODE_ENV=production` set

---

## Task

> The template **ships** the dev gate and the `render.yaml` Blueprint. Steps 1–2
> turn them on and prove they work; Steps 3–7 provision your own cloud and deploy.
> You can't deploy _my_ infra — you create **your** accounts and paste **your**
> secrets into the platform.

### Step 1: Turn on the local gate

```bash
# from the repo root (the folder with render.yaml + santa-api/ + …)
npm install          # installs husky/commitlint/lint-staged AND activates hooks
```

`npm install` runs the `prepare` script (`husky`), which wires `.husky/` as your
hooks directory. (If you cloned before installing, just run `npm install` again.)

### Step 2: Prove the hooks work

```bash
# commit-msg (commitlint)
git commit -m "update stuff"      # ✗ rejected: type must be one of [feat, fix, …]
git commit -m "chore: try hooks"  # ✓ passes; pre-commit runs lint-staged on staged files

# pre-push gate (your CI)
git push                          # runs lint + type-check + test for all three apps
# Introduce a lint error, push again, and confirm the push is aborted.
```

### Step 3: Provision managed services (your accounts)

**MongoDB Atlas**

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) → **Build a
   Database** → **M0 Free** → pick a cloud/region → create.
   - **Pick the region closest to your backend, not to you** — the browser talks
     to Render, and Render makes dozens of DB queries per request, so _app↔DB_
     latency is what matters. Choose **AWS · Frankfurt (`eu-central-1`)**: M0 is
     reliably available there, it's the nearest big hub to Kyiv (~25–40 ms), and
     it **matches the Render region** (`region: frankfurt` in `render.yaml`), so
     app↔DB drops to ~1–2 ms. Put Redis Cloud and CloudAMQP in Frankfurt too.
2. **Database Access** → **Add New Database User** (username + password; "Read
   and write to any database").
3. **Network Access** → **Add IP Address** → **Allow access from anywhere**
   (`0.0.0.0/0`) — Render's free egress IPs aren't fixed, so allow-all is the
   pragmatic choice for a course.
4. **Connect → Drivers** → copy the SRV string:
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. You'll use it **twice**, with a different database name per service:
   - santa-api → `…mongodb.net/santa?retryWrites=true&w=majority`
   - santa-notifications → `…mongodb.net/santa-notifications?retryWrites=true&w=majority`

**Redis Cloud**

What Redis is for here: santa-api uses it for the shared rate-limiter (throttler
across instances) and the stricter auth limit (`INCR`+`EXPIRE`);
santa-notifications uses it for presence (`online:users` set) and **pub/sub** for
the Socket.IO Redis adapter (so WebSockets work across multiple instances). All
of that is plain `SET`/`INCR`/`EXPIRE`/sets/pub-sub — no version-specific features.

1. Sign up at [redis.io/cloud](https://redis.io/cloud) → **New database** → free
   plan (**30 MB**).
2. **Cloud + region:** choose **AWS · Europe (Frankfurt)** — same region as Render
   and Atlas, so app↔Redis is ~1–2 ms.
3. **Redis version:** pick the **latest stable offered in your region** — on the
   free tier in Frankfurt that's usually **8.4** (8.6 may not be available there).
   We only use core commands, so any 8.x is fine; keep the region, take whatever
   version it allows.
4. Copy host, port, and the default user password, then build the URL:
   `redis://default:PASS@HOST:PORT`

**CloudAMQP** (managed RabbitMQ)

What RabbitMQ is for here: it's the backbone of the event-driven flow. santa-api
**publishes** domain events (`draw.completed`, `message.sent`,
`room.date_changed`, …) to a topic exchange; santa-notifications **consumes**
them, creates per-recipient notifications, and pushes them over WebSocket. Both
services need the **same** instance.

1. Sign up at [cloudamqp.com](https://www.cloudamqp.com) → **Create New Instance**.
2. **Plan:** **Little Lemur** (free).
3. **Region:** **Amazon Web Services** → **EU-Central-1 (Frankfurt)** — same
   region as Render / Atlas / Redis, so everything is co-located.
4. Create, open the instance, and copy the **AMQP URL** from the details page:
   `amqps://USER:PASS@HOST/VHOST` — the `amqps` scheme is TLS (already encrypted,
   nothing to toggle). Use the **same URL** for both `RABBITMQ_URL` vars.

Keep these six values handy — you paste them into Render in Step 5.

### Step 4: Create the Render Blueprint (your own Render account)

1. Make sure `render.yaml` is on GitHub at the **repo root** (next to
   `santa-api/`, `santa-notifications/`, `santa-app/`).
2. Go to [render.com](https://render.com) → **Get Started** → **Sign up with
   GitHub** → authorize Render.
3. Let Render see the repo:
   - **Private repo:** click **Configure account** / install the **Render GitHub
     App** and grant it the repo (for an org repo, the owner approves it once).
4. In the dashboard: **New +** (top-right) → **Blueprint**.
5. Pick the repo (or paste its public Git URL), then **choose the branch** to
   deploy from — e.g. `deploy/<your-name>`. This is how each student deploys
   their **own** branch from the shared repo (you can change it later per service
   in **Settings → Branch**). Render scans the **root** `render.yaml` and shows
   the plan: 2 Docker web services, 1 static site, and the `santa-shared` env
   group.
6. Render asks for the `sync: false` values **before it applies**. Paste what you
   have now — the **connection strings**: `MONGO_URL` (the `/santa` one for
   santa-api, `/santa-notifications` for the other), `REDIS_URL`, `RABBITMQ_URL`.
   Leave the cross-URLs (`CORS_ORIGIN`, `SANTA_API_URL`, `VITE_API_URL`,
   `VITE_WS_URL`) **blank for now** — you don't know the URLs until the services
   exist.
7. Name the Blueprint group → **Apply / Create Resources**. Render builds the
   services and generates `JWT_SECRET` + `SERVICE_API_KEY` in the group. Each
   service gets a URL like `https://santa-api-xxxx.onrender.com` (find it at the
   top of each service's page).

### Step 5: Fill in the cross-service URLs (now that you know them)

You entered the connection strings during Apply. Now each service has a real
`…onrender.com` URL, so open **Environment** on each service and fill the
cross-references you left blank (then redeploy in Step 6). Full list per service
for reference:

**santa-api**

```
MONGO_URL    = mongodb+srv://…/santa?retryWrites=true&w=majority
REDIS_URL    = redis://default:…@…:PORT
RABBITMQ_URL = amqps://…@…/VHOST
CORS_ORIGIN  = https://santa-app-xxxx.onrender.com
```

**santa-notifications**

```
MONGO_URL    = mongodb+srv://…/santa-notifications?retryWrites=true&w=majority
REDIS_URL    = redis://default:…@…:PORT           # same Redis instance
RABBITMQ_URL = amqps://…@…/VHOST                  # same CloudAMQP instance
SANTA_API_URL = https://santa-api-xxxx.onrender.com
CORS_ORIGIN  = https://santa-app-xxxx.onrender.com
```

**santa-app** (build-time, baked into the bundle)

```
VITE_API_URL = https://santa-api-xxxx.onrender.com
VITE_WS_URL  = https://santa-notifications-xxxx.onrender.com
```

`NODE_ENV`, `PORT`, `JWT_EXPIRATION`, `LOG_LEVEL`, and the shared secrets come
from `render.yaml`/the group — you don't set those by hand.

> **`VITE_WS_URL` is an `https://` URL — not `ws://` / `wss://`.** It points at
> the santa-notifications service (`https://santa-notifications-xxxx.onrender.com`).
> Socket.IO does its handshake over HTTPS and upgrades to a WebSocket itself, so
> use the plain `https://` origin (same shape as `VITE_API_URL`).

After editing a service's variables click **Save Changes**. The new values only
take effect on the **next deploy** (Step 6) — so set **all** of a service's vars
first, then redeploy that service once.

### Step 6: Deploy (manual)

Deploys are manual (`autoDeploy: false`). Two ways:

**Dashboard** — open each service → **Manual Deploy → Deploy latest commit**.

**CLI** — install the Render CLI, then trigger a deploy per service:

```bash
# https://render.com/docs/cli
render login
render services            # list services to get their IDs (srv-…)
render deploys create srv-XXXXXXXX --wait   # repeat per service
```

**Redeploy after changing env vars.** Editing variables doesn't auto-deploy here
(`autoDeploy: false`). After **Save Changes**, hit **Manual Deploy** on that
service. A **backend** picks up new env on restart; the **static santa-app reads
`VITE_*` only at build time**, so it must be rebuilt — use **Manual Deploy →
Clear build cache & deploy** so the new `VITE_*` are baked in.

**Order matters once:** the static `santa-app` bakes `VITE_*` at **build** time,
so deploy the **backends first**, confirm their URLs, set `VITE_API_URL` /
`VITE_WS_URL` to point at them, then deploy `santa-app`. If you change a `VITE_*`
value later, you must **redeploy santa-app** for it to take effect.

### Step 7: Verify the deployed app

```bash
curl https://santa-api-xxxx.onrender.com/api/health
# { "status": "ok", "uptime": … }

curl https://santa-notifications-xxxx.onrender.com/health
# { "status": "ok" }
```

Then open the santa-app URL and run the full flow: register, create a room (with
a budget), invite a second account (incognito window), join, run the draw (pick
the exchange date), reveal assignments, send an anonymous message, and confirm
the bell + real-time toast fire. Free Render services **spin down when idle**, so
the first request after a pause takes a few seconds to wake — that's expected.

## Verification

```bash
# Local CI gate
git commit -m "bad message"        # rejected by commitlint
npm run ci                         # lint + type-check + test for all 3 apps
git push                           # the pre-push hook runs the same gate

# Coverage (optional)
cd santa-api && npm run test:e2e:cov   # > 80% on services/controllers
cd santa-app && npm test -- --coverage # (vitest will offer to install @vitest/coverage-v8)

# Deployed health
curl https://santa-api-xxxx.onrender.com/api/health
curl https://santa-notifications-xxxx.onrender.com/health
```

## Learn More

- [Husky](https://typicode.github.io/husky/)
- [Conventional Commits](https://www.conventionalcommits.org/) · [commitlint](https://commitlint.js.org/)
- [Render Blueprints (IaC)](https://render.com/docs/blueprint-spec) · [Render CLI](https://render.com/docs/cli)
- [MongoDB Atlas](https://www.mongodb.com/atlas) · [Redis Cloud](https://redis.io/cloud) · [CloudAMQP](https://www.cloudamqp.com/)
- [The Twelve-Factor App](https://12factor.net/)
