# Lesson 01: Docker & Infrastructure

## Quick Overview

Until now you have been running `santa-api`, `santa-notifications`, and MongoDB as separate processes on your machine. This works for development, but it is fragile -- every new developer must install exact versions of Node.js, MongoDB, and any other dependencies manually. Docker solves this by packaging each service into an isolated, reproducible **container** that runs identically on any machine.

By the end of this lesson you will:

- Understand the multi-stage Dockerfile and `docker-compose.yml` that ship with the
  template and bring up the whole backend (`santa-api`, `santa-notifications`,
  mongo, redis, rabbitmq) with a single `docker compose up --build`
- Have written your own multi-stage Dockerfile for the **frontend** (`santa-app`),
  served as static files behind nginx
- Understand container networking (service-name hostnames), `depends_on` healthchecks,
  and persistent volumes so data survives restarts

---

## Key Concepts

### 1. Containers vs Virtual Machines

A **virtual machine** (VM) runs a full guest operating system on top of a hypervisor. Each VM has its own kernel, which makes it heavyweight (gigabytes of disk, minutes to boot).

A **container** shares the host kernel and isolates processes using Linux namespaces and cgroups. Containers are lightweight (megabytes, seconds to start) and far more efficient for running application workloads.

```
VM Stack                    Container Stack
┌──────────────────┐       ┌──────────────────┐
│   App A │  App B │       │   App A │  App B │
│   Bins  │  Bins  │       │   Bins  │  Bins  │
│ Guest OS│Guest OS│       ├──────────────────┤
├──────────────────┤       │  Container Engine │
│    Hypervisor    │       │  (Docker)         │
├──────────────────┤       ├──────────────────┤
│    Host OS       │       │    Host OS        │
└──────────────────┘       └──────────────────┘
```

### 2. Docker Core Concepts

| Concept | Description |
|---------|-------------|
| **Image** | A read-only template with everything needed to run an application (OS base, runtime, app code, dependencies). |
| **Container** | A running instance of an image. You can start, stop, and destroy containers without affecting the image. |
| **Layer** | Images are built from layers. Each Dockerfile instruction creates a layer. Unchanged layers are cached, making rebuilds fast. |
| **Registry** | A storage service for images (Docker Hub, GitHub Container Registry, AWS ECR). `docker pull` fetches images from a registry. |

### 3. Dockerfile

A Dockerfile is a text file with instructions that tell Docker how to build an image.

```dockerfile
# Base image
FROM node:22-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency manifests first (layer caching!)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# Document the port the app listens on
EXPOSE 3001

# Command to run when the container starts
CMD ["node", "dist/main.js"]
```

**Key instructions:**

| Instruction | Purpose |
|-------------|---------|
| `FROM` | Sets the base image (e.g., `node:22-alpine` for a slim Node.js image) |
| `WORKDIR` | Sets the working directory for subsequent instructions |
| `COPY` | Copies files from host into the image |
| `RUN` | Executes a command during the build (e.g., `npm ci`) |
| `CMD` | The default command when a container starts |
| `EXPOSE` | Documents which port the app uses (informational, does not publish the port) |

**Layer caching matters.** Docker caches each layer and only rebuilds layers that changed. By copying `package.json` and running `npm ci` *before* copying source code, you avoid reinstalling dependencies every time you change a line of code.

### 4. .dockerignore

Just like `.gitignore`, a `.dockerignore` file prevents unnecessary files from being sent to the Docker build context:

```
node_modules
dist
.git
.env
*.md
.DS_Store
```

Without this file, `COPY . .` would send `node_modules` (hundreds of megabytes) to the build context, slowing down builds dramatically.

### 5. Multi-Stage Builds

A multi-stage build uses multiple `FROM` instructions. Each stage starts fresh, and you can selectively copy artifacts from a previous stage. This produces a smaller final image because build tools and dev dependencies are left behind.

```dockerfile
# ---------- Stage 1: Build ----------
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:22-alpine AS production

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main.js"]
```

The `build` stage has all dev dependencies (TypeScript compiler, etc.). The `production` stage only has production dependencies and the compiled output. The final image can be 3-5x smaller.

### 6. Docker Compose

Docker Compose lets you define and run multi-container applications. You describe all services, networks, and volumes in a single `docker-compose.yml` file.

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7
    ports:
      - '27017:27017'
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  santa-api:
    build:
      context: ./santa-api
      dockerfile: Dockerfile
    ports:
      - '3001:3001'
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      - MONGO_URL=mongodb://mongo:27017/santa

volumes:
  mongo-data:
```

**Key compose concepts:**

| Concept | Description |
|---------|-------------|
| `services` | Each service becomes a container (e.g., `mongo`, `santa-api`). |
| `build` | Builds an image from a Dockerfile instead of pulling from a registry. |
| `ports` | Maps `host:container` ports. `3001:3001` means host port 3001 forwards to container port 3001. |
| `volumes` | Named volumes persist data. `mongo-data:/data/db` keeps MongoDB data across container restarts. |
| `depends_on` | Controls startup order. With `condition: service_healthy`, a service waits until the dependency is healthy. |
| `environment` | Passes environment variables into the container. |
| `healthcheck` | Defines a command Docker runs periodically to check if a service is healthy. |

### 7. Docker Networking

By default, Compose creates a single network for all services. Services can reach each other by **service name** as hostname. For example, `santa-api` can connect to MongoDB at `mongodb://mongo:27017/santa` -- `mongo` is the service name, and Docker resolves it to the correct container IP.

This means you never use `localhost` to connect between containers. `localhost` inside a container refers to that container itself.

### 8. Persistent Volumes

Containers are **ephemeral** -- when a container is removed, its filesystem is gone. For databases, this means all data is lost. Named volumes solve this:

```yaml
volumes:
  mongo-data:  # Docker manages the storage location
```

The volume `mongo-data` persists even when the container is destroyed. When you run `docker-compose up` again, MongoDB picks up right where it left off.

---

## Task

> **Two starting points.** The recommended template (`00-kickoff/template/`) already
> ships a working backend Docker setup: `santa-api/Dockerfile`,
> `santa-notifications/Dockerfile`, their `.dockerignore` files, and a
> `docker-compose.yml` that builds both services on top of mongo/redis/rabbitmq.
> So your hands-on Dockerfile practice in this lesson is the **frontend**.
>
> - **Using the template?** Do Step 1 (study the provided backend setup) and
>   Step 2 (Dockerize `santa-app` yourself).
> - **Using your own services?** The backend `docker-compose.yml` isn't written for
>   you — apply the patterns from Step 1 to your own `santa-api`/`santa-notifications`
>   first, then do Step 2.

### Step 1: Study and run the provided backend Docker setup

Open and read these three files in the template — they are the concepts above made concrete:

- `santa-api/Dockerfile` — multi-stage build (`npm ci` → `npm run build` → `npm ci --omit=dev` → copy `dist/`).
- `santa-notifications/Dockerfile` — same pattern, `CMD ["node", "dist/server.js"]`.
- `docker-compose.yml` — `mongodb` / `redis` / `rabbitmq` plus the two backend services. Note:
  - hostnames are **service names** (`mongodb`, `redis`, `rabbitmq`), not `localhost`;
  - `depends_on: { condition: service_healthy }` waits for infra healthchecks;
  - secrets (`JWT_SECRET`, `SERVICE_API_KEY`) are dev placeholders — you change these for any real deployment.

Bring the whole backend up and confirm it's healthy:

```bash
docker compose up --build         # builds santa-api + santa-notifications, starts everything
docker compose ps                 # all services Up; infra healthy
curl http://localhost:3001/docs   # Swagger from santa-api
```

Answer for yourself: *why does the build stage run `npm ci` (all deps) but the
production stage run `npm ci --omit=dev`?* (Hint: `@nestjs/cli` / `tsc` are only
needed to build.)

#### Two hardening details the backend images ship with

- **Non-root user.** The production stage ends with `USER node` — the `node:alpine`
  images include an unprivileged `node` user. Running as root inside a container is
  a common foot-gun: if the process is compromised, root-in-container is a step
  toward root-on-host. Switch to `node` after the last `COPY`/`RUN` that needs
  write access.
- **Backend healthchecks.** `depends_on: { condition: service_healthy }` only
  helps if the dependency *declares* a healthcheck. Infra images do; your backends
  should too, so Compose (and orchestrators) know when they're actually ready —
  not just "process started". Both backends expose a health route
  (`GET /api/health` on santa-api, `GET /health` on santa-notifications), so the
  compose healthcheck just calls it. The image already has Node (with global
  `fetch`), so no `curl`/`wget` is needed:

  ```yaml
  healthcheck:
    test: ["CMD", "node", "-e", "fetch('http://localhost:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 25s   # grace period while the app boots
  ```

  (You could equally put a `HEALTHCHECK` instruction in the Dockerfile; in compose
  it's more visible and overridable per-environment.)

### Step 2: Dockerize the frontend (santa-app) — your turn

The client runs on Vite (`npm run dev`) day-to-day, but production ships as static
files behind a web server. Write it yourself:

1. **`santa-app/.dockerignore`**

   ```
   node_modules
   dist
   .git
   .env
   .env.*
   *.md
   .DS_Store
   ```

2. **`santa-app/Dockerfile`** — multi-stage: build with Node, serve with nginx.

   - **Build stage** (`node:22-alpine AS build`): `WORKDIR /app`, copy manifests,
     `npm ci`, copy source, `npm run build` (Vite emits static files to `dist/`).
   - **Serve stage** (`nginx:alpine`): copy `--from=build /app/dist` into
     `/usr/share/nginx/html`, `EXPOSE 80`.
   - Add an `nginx.conf` with an SPA fallback so client-side routes resolve:
     `try_files $uri $uri/ /index.html;`

3. Remember Vite bakes `VITE_*` env at **build time**. Pass the API URL as a build
   arg (`ARG VITE_API_URL` → `ENV VITE_API_URL=$VITE_API_URL` before `npm run build`)
   so the image knows where the API lives.

> Day-to-day you'll still run the client with `npm run dev` for hot-reload — the
> Dockerfile is for production builds and deployment (Lesson 11).

### Step 3 (optional): Add santa-app to compose

If you want the whole stack in one `docker compose up`, add a `santa-app` service
that builds from `./santa-app` with `args: { VITE_API_URL: http://localhost:3001 }`
and maps `5173:80`. Keep it optional — the default workflow is Vite for the client.

### Step 4: Dev vs prod images (hot reload)

The production `Dockerfile` ships a small, immutable image (`node dist/...`) — but
it has to rebuild on every code change, which is painful while developing. So each
backend also ships a **`Dockerfile.dev`**: a single stage with all dependencies
that runs the **watch** command (`npm run start:dev` for santa-api, `npm run dev`
for santa-notifications).

A second compose file, **`docker-compose.dev.yml`**, overlays the base stack to
use those dev images, set `NODE_ENV=development`, and **bind-mount the source**
into the container so edits on the host restart the in-container server:

```yaml
services:
  santa-api:
    build: { context: ./santa-api, dockerfile: Dockerfile.dev }
    environment: { NODE_ENV: development }
    volumes:
      - ./santa-api:/app
      - /app/node_modules   # keep the container's Linux deps, not the host's
```

Run each mode:

```bash
# Production images (default)
docker compose up --build

# Dev — hot reload: base + dev overlay
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The anonymous `/app/node_modules` volume is the key trick: the bind-mount would
otherwise hide the container's `node_modules` (built for Linux) behind the host's
(built for your OS) — that volume preserves the container's.

> ⚠️ Gotcha: that anonymous volume **persists across rebuilds**, so after you add
> a dependency a plain `--build` is not enough — the stale volume shadows the
> freshly-installed `node_modules` and you'll get "Cannot find module 'x'". Renew
> it: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
> --renew-anon-volumes santa-api`.

### Inspecting the running services (GUI, optional)

The CLI (`docker compose exec … mongosh / redis-cli`) is enough, but a GUI is
nicer for poking around. The infra ports are published to your host, so point any
client at `localhost`:

| Service | Tool | Connect to |
|---------|------|------------|
| MongoDB | [MongoDB Compass](https://www.mongodb.com/products/compass) | `mongodb://localhost:27017` |
| Redis | [Medis](https://getmedis.com/) or [RedisInsight](https://redis.io/insight/) | `localhost:6379` |
| RabbitMQ | built-in **Management UI** (ships with the `-management` image) | http://localhost:15672 (user/pass `santa` / `santa123`) |

These connect to the containers via the published ports — no extra setup.

---

## Verification

```bash
# Backend stack (from the template) — all up, infra healthy
docker compose ps

# santa-api is serving
curl http://localhost:3001/docs        # Swagger UI

# Services reach MongoDB by service name, not localhost
docker compose exec mongodb mongosh --eval 'db.runCommand("ping")'

# Your frontend image builds and is small (multi-stage + nginx)
docker build -t santa-app ./santa-app --build-arg VITE_API_URL=http://localhost:3001
docker images | grep santa

# Run your frontend image and open http://localhost:8080
docker run --rm -p 8080:80 santa-app

# Stop the stack
docker compose down
docker compose down -v                 # also deletes volumes (all data!)
```

**Troubleshooting tips:**

- Service can't reach MongoDB/Redis/RabbitMQ → use the **service name**
  (`mongodb`, `redis`, `rabbitmq`), not `localhost`, inside a container.
- Build slow or image huge → confirm `.dockerignore` excludes `node_modules` and `dist`.
- `Bind for 0.0.0.0:3001 failed: port is already allocated` → a local `npm run start:dev`
  is still holding the port; stop it before `docker compose up`.
- Frontend shows a blank page on refresh of a sub-route → missing SPA fallback in `nginx.conf`.
