# Secret Santa — Recommended Template

This folder is the **recommended starting point** for the Fullstack block. It is
kept **here, under the kickoff lesson**, on purpose — so it never collides with
your own `santa-api` / `santa-notifications` / `santa-app` when you pull updates.
**You copy out what you want; nothing is forced on you.**

## What's inside

| Folder | Stack | What you get |
|--------|-------|--------------|
| `santa-api/` | NestJS + MongoDB | **Skeleton**: controllers, DTOs, Mongoose schemas, modules, the API contract, Dockerfile, a component-test harness (worked example + `it.todo`s). Service logic is stubbed — you implement it (Kickoff §4). |
| `santa-notifications/` | Fastify + MongoDB | **Skeleton**: app + routes + scripts (`dev`/`start`/`build`/`test`), Dockerfile, Jest test harness, `.env.example` |
| `santa-app/` | React + Vite + Tailwind + shadcn | Worked-example `LoginPage` + page stubs, RTL+MSW test setup, `docs/design-system.md`, `docs/design-tokens.json`, `docs/mockups/`, `public/decor/` |
| `docker-compose.yml` | mongo:8 · redis:8 · rabbitmq:4 + both backends | Full local stack (`name: santa`) |

## How to use it

**Option A — overlay the whole template (recommended).** Copy its contents onto
your root `santa-*` projects (the ones you've grown since Block 04). From the
repo root:

```bash
T=src/06-fullstack/lessons/00-kickoff/template
cp -R "$T/santa-api/."            santa-api/
cp -R "$T/santa-notifications/."  santa-notifications/
cp -R "$T/santa-app/."            santa-app/
cp    "$T/docker-compose.yml"     docker-compose.yml   # replaces the older root compose
```

**Option B — cherry-pick.** Overlay only what you need, e.g. keep your own
Block-04 backend but take our `santa-app` baseline:

```bash
cp -R src/06-fullstack/lessons/00-kickoff/template/santa-app/. santa-app/
```

**Option C — keep your own.** Ignore the template entirely and keep building on
your Block-04 work. Use this as a reference to compare against.

> **Regardless of the option**, take the template's `docker-compose.yml` into the
> repo root (`cp "$T/docker-compose.yml" docker-compose.yml`) — the older root
> compose has both backends commented out and stale image versions.

> The trailing `/.` overlays *contents* onto your existing folders (so your
> Block-04 `examples/`/`exercises/` stay). Don't copy `template/`'s own
> `README.md` to the root, and never edit files **inside** `template/` — it's the
> source you copy from. That keeps your pulls conflict-free.

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
