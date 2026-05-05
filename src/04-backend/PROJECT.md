# The Secret Santa Project

> 📌 **This is the end-state architecture.** Don't try to build it all at once.
> Follow the lessons sequentially — App Tasks inside lessons walk you through each piece.

Throughout the backend and frontend blocks, you build a **Secret Santa** application — a web app where users create rooms, invite friends, set wishlists, randomly draw gift assignments, and send anonymous messages.

## Architecture

You'll build **two backend microservices** that live at the repo root (not inside `src/`):

| Service | Framework | Port | Responsibility |
|---------|-----------|------|----------------|
| **santa-api** | NestJS + Fastify adapter | 3001 | Main API: auth, users, rooms, wishlists, assignments |
| **santa-notifications** | Raw Fastify | 3002 | Notifications, anonymous messages, real-time push |

The two services communicate via:
- **RabbitMQ** — async events (e.g. "room.created" fires a notification)
- **HTTP** — sync calls between services when needed

The frontend is a React SPA, built later in **Block 05**.

By the end of Block 04, you'll have two working backends with auth, MongoDB, validation, structured logging, and a full REST API — all covered by tests.

## Which Lesson Builds What

App Tasks are the practical pieces glued onto each lesson. They appear as `exercises/app-task.md` in the lesson folder. Below is the **current** state of App Tasks (some lessons don't have an App Task yet — only standalone exercises):

### santa-notifications (Fastify)

| Lesson | App Task |
|--------|----------|
| 01 — Node.js & npm | Bootstrap the project: `npm init`, `tsconfig.json`, `GET /health` |
| 02 — HTTP & REST | In-memory CRUD: `GET/POST/PATCH/DELETE /api/notifications` |
| 03 — Fastify | Restructure into Fastify plugins, JSON Schema validation, error handler, timing plugin |
| 06 — Validation & Errors | Add JSON Schema to all routes, custom error hierarchy, centralized error handler, Pino + pretty |
| 07 — MongoDB & Mongoose | Replace in-memory store with Mongoose `Notification` model, compound indexes |

### santa-api (NestJS)

| Lesson | App Task |
|--------|----------|
| 04 — NestJS Fundamentals | Bootstrap with NestJS CLI + FastifyAdapter, then `UsersModule` + `RoomsModule` (in-memory) |
| 05 — NestJS Advanced | DTOs + global `ValidationPipe`, `LoggingInterceptor`, `AllExceptionsFilter`, `WishlistModule` |
| 06 — Validation & Errors | Replace default logger with `nestjs-pino` |
| 07 — MongoDB & Mongoose | Replace in-memory `Map` storage with Mongoose models for User/Room/Wishlist |

### Future lessons

Lessons 08-10 don't have `app-task.md` files yet. The corresponding work (auth + JWT, API security/Swagger, end-to-end tests) is to be added as the course evolves. For now, focus on the standalone exercises in those lessons.

## Final Layout

When you're done with Block 04, your repo should look like this:

```
fullstack-training/
  santa-api/                ← NestJS + Fastify + MongoDB + JWT auth
  santa-notifications/      ← Raw Fastify + plugins + JSON Schema
  src/
    01-javascript/
    02-typescript/
    03-tests/
    04-backend/             ← lessons + this PROJECT.md
    05-frontend/            ← React SPA (later)
    06-fullstack/           ← integration (later)
```
