# Backend Node.js

## Prerequisites

Before starting this section, you should have completed:

- **Block 1**: JavaScript Basics (14 lessons)
- **Block 2**: TypeScript (6 lessons)
- **Block 3**: Testing with Jest (6 lessons)

> ⚠️ **Don't start the Secret Santa project from this README.**
> Just go to [lessons/01-nodejs-and-npm/](lessons/01-nodejs-and-npm/) and follow each lesson in order.
> App Tasks are introduced gradually inside specific lessons.
> See [PROJECT.md](./PROJECT.md) for the end-state architecture — but don't try to build it all upfront.

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
- **examples/** — Working runnable code demonstrating concepts
- **exercises/** — TODO-based standalone exercises

Some lessons also include an **App Task** (`exercises/app-task.md`) — a concrete piece of work in the real `santa-api` / `santa-notifications` projects that live at the repo root. The full project picture is in [PROJECT.md](./PROJECT.md). You build the apps gradually as you progress through the lessons — don't try to set everything up on day one.

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

## How to Work

1. Read the lesson **README.md** for theory
2. Run **examples/** with `npx ts-node examples/filename.ts`
3. Complete **exercises/** by replacing TODO comments with your code
4. Complete the **App Task** (if present in `exercises/app-task.md`) — this is where you touch the real `santa-api` / `santa-notifications` projects

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
