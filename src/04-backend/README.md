# Backend Node.js

## Prerequisites

Before starting this section, you should have completed:

- **Block 1**: JavaScript Basics (14 lessons)
- **Block 2**: TypeScript (6 lessons)
- **Block 3**: Testing with Jest (6 lessons)

## The Project: Secret Santa

Throughout the backend and frontend blocks, you will build a **Secret Santa** application — a web app where users can create rooms, invite friends, set wishlists, randomly draw gift assignments, and send anonymous messages.

You'll build **two backend microservices**:

| Service | Framework | Port | What it does |
|---------|-----------|------|-------------|
| **santa-api** | NestJS + Fastify adapter | 3001 | Main API: auth, users, rooms, wishlists, assignments |
| **santa-notifications** | Raw Fastify | 3002 | Notifications, anonymous messages, real-time push |

These two services communicate via RabbitMQ (async events) and HTTP (sync calls). The frontend will be a React SPA (built in Block 05).

Each lesson includes standalone exercises for practice **and** an app task where you implement a real feature in one of the services. By the end of Block 04, you'll have two working backends with auth, MongoDB, and a full REST API.

## What You'll Learn

- How Node.js works under the hood (event loop, modules, npm)
- Building REST APIs with HTTP protocol fundamentals
- Raw Fastify framework — plugins, hooks, decorators, Context-based DI
- NestJS framework — modules, controllers, providers, dependency injection
- Input validation, error handling, and structured logging
- MongoDB with Mongoose ODM — schemas, indexes, queries
- Authentication with JWT, bcrypt, Passport, and RBAC
- API design best practices — Swagger, CORS, pagination, security
- Backend testing — unit tests, integration tests, test databases

## Course Structure

Each lesson contains:
- **README.md** — Theory, concepts, code snippets, links to resources
- **QUESTIONS.md** — 5-8 evaluation questions
- **examples/** — Working runnable code demonstrating concepts
- **exercises/** — TODO-based standalone exercises

Most lessons also include an **App Task** — a concrete task to implement in the real Secret Santa applications (`santa-api` and `santa-notifications` at the repo root). You build the apps gradually as you progress through the lessons.

### Lessons

| #  | Topic | Technologies | Description |
|----|-------|-------------|-------------|
| 01 | [Node.js & npm](lessons/01-nodejs-and-npm/) | Node.js, npm, semver, ts-node | Event loop, CJS vs ESM, npm ci/install, package.json, scripts |
| 02 | [HTTP & REST](lessons/02-http-and-rest/) | HTTP protocol, REST, status codes | Request/response cycle, REST design, methods, idempotency |
| 03 | [Fastify](lessons/03-fastify/) | Fastify, plugins, hooks, decorators | Plugin system, lifecycle hooks, encapsulation, Context DI |
| 04 | [NestJS Fundamentals](lessons/04-nestjs-fundamentals/) | NestJS, modules, DI, Fastify adapter | Architecture, controllers, providers, dependency injection |
| 05 | [NestJS Advanced](lessons/05-nestjs-advanced/) | Guards, pipes, interceptors, DTOs | Request lifecycle, ValidationPipe, exception filters |
| 06 | [Validation & Error Handling](lessons/06-validation-and-error-handling/) | JSON Schema, AJV, Pino | Input validation, custom errors, structured logging |
| 07 | [MongoDB & Mongoose](lessons/07-mongodb-and-mongoose/) | MongoDB, Mongoose, schemas, indexes | Document DB, CRUD, references, aggregation, transactions |
| 08 | [Authentication](lessons/08-authentication/) | JWT, bcrypt, Passport, RBAC | Password hashing, JWT flow, guards, roles |
| 09 | [API Design & Security](lessons/09-api-design-and-security/) | CORS, Swagger, Helmet, rate limiting | API docs, pagination, security headers, rate limiting |
| 10 | [Testing Backend](lessons/10-testing-backend/) | Jest, supertest, mongodb-memory-server | Unit/integration tests, mocking, test databases |

### App Tasks

As you progress through lessons, you gradually build two backend services for the Secret Santa application:

**santa-api** (NestJS + Fastify adapter) — port 3001
- Main API: users, rooms, wishlists, assignments, authentication
- Built in lessons 01, 02, 04, 05, 06, 07, 08, 09, 10

**santa-notifications** (raw Fastify) — port 3002
- Notification service: stores and serves notifications
- Built in lessons 01, 03, 06, 07, 10

Both apps live at the repo root (`/santa-api`, `/santa-notifications`).

## How to Work

1. Read the lesson **README.md** for theory
2. Run **examples/** with `npx ts-node examples/filename.ts`
3. Complete **exercises/** by replacing TODO comments with your code
4. Complete the **App Task** described at the bottom of each README
5. Answer **QUESTIONS.md** for self-evaluation

## Tech Stack

| Category | Technology | Lesson |
|----------|-----------|--------|
| Runtime | Node.js, npm, ts-node | 01 |
| Protocol | HTTP, REST | 02 |
| Frameworks | Fastify, NestJS | 03-05 |
| Validation | JSON Schema, AJV, class-validator, Joi | 06 |
| Logging | Pino, pino-pretty | 06 |
| Database | MongoDB, Mongoose | 07 |
| Auth | JWT, bcrypt, Passport | 08 |
| Security | Helmet, CORS, rate limiting | 09 |
| Docs | Swagger / OpenAPI | 09 |
| Testing | Jest, supertest, mongodb-memory-server | 10 |
