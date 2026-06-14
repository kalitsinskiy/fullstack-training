# Secret Santa — Recommended Template

This folder is the **recommended starting point** for the Fullstack block. It is
kept **here, under the kickoff lesson**, on purpose — so it never collides with
your own `santa-api` / `santa-notifications` / `santa-app` when you pull updates.
**You copy out what you want; nothing is forced on you.**

## What's inside

| Folder | Stack | What you get |
|--------|-------|--------------|
| `santa-api/` | NestJS + MongoDB | Auth, rooms, wishlists, draw + assignment endpoints, e2e suite, CORS for the Vite frontend, `.env.example` |
| `santa-notifications/` | Fastify + MongoDB | Service skeleton + `dev`/`start`/`build` scripts (nodemon + ts-node), `.env.example` |
| `santa-app/` | React + Vite + Tailwind + shadcn | Worked-example `LoginPage` + page stubs, `docs/design-system.md`, `docs/design-tokens.json`, `docs/mockups/`, `public/decor/` |
| `docker-compose.yml` | mongo:8 · redis:8 · rabbitmq:4 | Local infra |

## How to use it

**Option A — take the whole template (recommended).** Copy it to your repo root:

```bash
cp -R src/06-fullstack/lessons/00-kickoff/template/. .
# now santa-api/, santa-notifications/, santa-app/, docker-compose.yml are at root
```

**Option B — cherry-pick.** Copy only what you need, e.g. keep your own Block-04
backend but take our `santa-app` baseline:

```bash
cp -R src/06-fullstack/lessons/00-kickoff/template/santa-app .
```

**Option C — keep your own.** Ignore the template entirely and keep building on
your Block-04 work. Use this as a reference to compare against.

> Don't edit files **inside** this `template/` folder for your own work — copy
> them out first. That keeps your pulls conflict-free.

## Run it (after copying to root)

**Full stack in one command** — backends build and run in Docker alongside the infra:

```bash
docker compose up --build                             # mongo/redis/rabbitmq + santa-api :3001 + santa-notifications :3002
cd santa-app && npm install && cp .env.example .env && npm run dev   # client on Vite :5173
```

**Backend dev mode (hot-reload)** — run only the infra in Docker, the backends locally:

```bash
docker compose up -d mongodb redis rabbitmq           # infra only
cd santa-api            && npm install && cp .env.example .env && npm run start:dev   # :3001
cd ../santa-notifications && npm install && cp .env.example .env && npm run dev       # :3002
cd ../santa-app         && npm install && cp .env.example .env && npm run dev         # :5173
```

The client always runs on Vite for hot-reload; Dockerizing it is your Lesson 01 task.

First account: `RegisterPage` is a stub you build later — create your first user
via Swagger (`http://localhost:3001/docs`) or curl, then sign in through the UI
(`LoginPage` is the worked example). See the kickoff `README.md` for details.

## Note on ports

If your machine already runs services on 27017 / 6379 / 5672, either stop them
or add a `docker-compose.override.yml` remapping the host ports, and point the
`.env` files at the new ports.
