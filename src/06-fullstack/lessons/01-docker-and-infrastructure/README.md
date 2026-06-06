# Lesson 01: Docker & Infrastructure

## Quick Overview

Until now you have been running `santa-api`, `santa-notifications`, and MongoDB as separate processes on your machine. This works for development, but it is fragile -- every new developer must install exact versions of Node.js, MongoDB, and any other dependencies manually. Docker solves this by packaging each service into an isolated, reproducible **container** that runs identically on any machine.

By the end of this lesson you will have:

- A multi-stage Dockerfile for each backend service
- A `docker-compose.yml` that starts the entire stack with a single command
- Persistent storage for MongoDB so data survives container restarts
- Healthcheck endpoints so Docker knows when a service is ready

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

### Step 1: Write a Dockerfile for santa-api

Create `santa-api/Dockerfile` with a multi-stage build:

1. **Build stage** (`node:22-alpine AS build`):
   - Set `WORKDIR /app`
   - Copy `package.json` and `package-lock.json`
   - Run `npm ci` to install all dependencies (including dev)
   - Copy the rest of the source code
   - Run `npm run build` to compile TypeScript

2. **Production stage** (`node:22-alpine`):
   - Set `WORKDIR /app`
   - Copy `package.json` and `package-lock.json`
   - Run `npm ci --omit=dev` (only production dependencies)
   - Copy the compiled `dist/` folder from the build stage
   - Expose port `3001`
   - Set `CMD` to `["node", "dist/main.js"]`

### Step 2: Write a Dockerfile for santa-notifications

Create `santa-notifications/Dockerfile` with the same multi-stage pattern:

- Build stage compiles TypeScript
- Production stage runs with only production dependencies
- Expose port `3002`
- Adjust the `CMD` to match santa-notifications entry point (e.g., `dist/server.js` -- check your project)

### Step 3: Create .dockerignore files

Create `.dockerignore` in both `santa-api/` and `santa-notifications/`:

```
node_modules
dist
.git
.env
*.md
.DS_Store
coverage
.eslintcache
```

### Step 4: Add healthcheck endpoints

In **santa-api**, add a `GET /health` endpoint that returns:

```json
{ "status": "ok", "service": "santa-api" }
```

In NestJS, you can create a `HealthController` or add the route to an existing controller.

In **santa-notifications**, add a `GET /health` endpoint that returns:

```json
{ "status": "ok", "service": "santa-notifications" }
```

In Fastify, register a simple route:

```typescript
fastify.get('/health', async () => {
  return { status: 'ok', service: 'santa-notifications' };
});
```

### Step 5: Create docker-compose.yml

Create `docker-compose.yml` at the **repository root** with three services:

1. **mongo**
   - Image: `mongo:8`
   - Port: `27017:27017`
   - Named volume: `mongo-data:/data/db`
   - Healthcheck: use `mongosh --quiet` to ping the database

2. **santa-api**
   - Build from `./santa-api/Dockerfile`
   - Port: `3001:3001`
   - Environment: `MONGO_URL=mongodb://mongo:27017/santa`, `PORT=3001`, `NODE_ENV=production`
   - Depends on `mongo` (with `condition: service_healthy`)
   - Healthcheck: `wget -qO- http://localhost:3001/health || exit 1`

3. **santa-notifications**
   - Build from `./santa-notifications/Dockerfile`
   - Port: `3002:3002`
   - Environment: `MONGO_URL=mongodb://mongo:27017/santa`, `PORT=3002`, `NODE_ENV=production`
   - Depends on `mongo` (with `condition: service_healthy`)
   - Healthcheck: `wget -qO- http://localhost:3002/health || exit 1`

4. **Volumes section**: define `mongo-data`

### Step 6: Test the full stack

Start everything:

```bash
docker-compose up --build
```

You should see all three services start up. Verify they are healthy:

```bash
docker-compose ps
```

---

## Verification

After running `docker-compose up --build`, verify each piece:

```bash
# Check all containers are running and healthy
docker-compose ps

# Test santa-api health endpoint
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"santa-api"}

# Test santa-notifications health endpoint
curl http://localhost:3002/health
# Expected: {"status":"ok","service":"santa-notifications"}

# Verify MongoDB is accessible (from the mongo container)
docker-compose exec mongo mongosh --eval 'db.runCommand("ping")'

# Check image sizes (multi-stage should be smaller)
docker images | grep santa

# Stop everything
docker-compose down

# Stop and remove volumes (deletes all data!)
docker-compose down -v
```

**Troubleshooting tips:**

- If a service fails to connect to MongoDB, make sure you are using `mongo` (the service name) not `localhost` in the `MONGO_URL`.
- If the build is slow, check that `.dockerignore` excludes `node_modules`.
- If ports are already in use, stop local instances of the services first.
