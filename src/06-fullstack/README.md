# Fullstack: Secret Santa Application

## Prerequisites

Before starting this section, you should have completed (or be actively working on):

- **Block 4**: Backend Node.js (10 lessons) — you should have working santa-api and santa-notifications
- **Block 5**: Frontend Development (8 lessons) — you should have working santa-app

## What You'll Build

A complete Secret Santa application with two backend microservices, a React frontend, and production infrastructure. By the end, you'll have a deployed, working app that you can share with others.

### The App

**Secret Santa** — create rooms, invite friends, set wishlists, draw random assignments, send anonymous messages, get real-time notifications.

### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────────┐
│  santa-app  │────▶│    santa-api      │────▶│  santa-notifications  │
│  React SPA  │     │  NestJS :3001     │     │  Fastify :3002        │
│  :5173      │     │                   │     │                       │
└─────────────┘     │  Auth, Rooms,     │     │  Notifications,       │
                    │  Wishlists, Draw  │     │  Anonymous Messages,  │
                    │                   │     │  WebSocket Push       │
                    └────────┬──────────┘     └───────────┬───────────┘
                             │                            │
                    ┌────────┴────────────────────────────┴───────────┐
                    │              Infrastructure                      │
                    │  MongoDB :27017  Redis :6379  RabbitMQ :5672    │
                    └─────────────────────────────────────────────────┘
```

### Communication Patterns

| Pattern | Direction | Use Case |
|---------|-----------|----------|
| RabbitMQ (async) | santa-api → santa-notifications | Room events, draw completed, messages |
| HTTP (sync) | santa-notifications → santa-api | Verify assignments, fetch user details |
| Socket.IO + Redis | santa-notifications → Browser | Real-time push notifications |
| REST API | santa-app → santa-api | All CRUD operations |

## Course Structure

Each lesson contains:
- **README.md** — Theory for new concepts + step-by-step app task
- **QUESTIONS.md** — Evaluation questions

Unlike blocks 04-05, there are no separate exercises — the app **is** the exercise. You implement features directly in the three app projects.

### Lessons

| #  | Topic | New Technology | What You Build |
|----|-------|---------------|----------------|
| 01 | [Docker & Infrastructure](lessons/01-docker-and-infrastructure/) | Docker, Dockerfile, docker-compose | Dockerfiles for both backends, docker-compose with MongoDB |
| 02 | [Environment & Config](lessons/02-environment-and-config/) | dotenv, config validation, 12-factor | EnvService for both backends, .env files, Vite env vars |
| 03 | [Rooms & Draw](lessons/03-rooms-and-draw/) | Derangement algorithm, MongoDB transactions | Draw endpoint, assignments, atomic transaction, draw UI |
| 04 | [Redis](lessons/04-redis/) | Redis, caching, TTL, rate limiting | Redis in compose, room caching, invite code expiry |
| 05 | [RabbitMQ](lessons/05-rabbitmq/) | RabbitMQ, exchanges, queues, DLQ | Event publishing and consuming between services |
| 06 | [Notifications](lessons/06-notifications/) | HTTP adapter, circuit breaker | Notification endpoints, HTTP inter-service calls, notification UI |
| 07 | [WebSockets](lessons/07-websockets/) | Socket.IO, JWT auth for WS, Redis adapter | Real-time push, useSocket hook, toast notifications |
| 08 | [Anonymous Messaging](lessons/08-anonymous-messaging/) | Service mediator, privacy patterns | Anonymous message relay, chat UI, real-time delivery |
| 09 | [Testing Microservices](lessons/09-testing-microservices/) | E2E testing, integration tests | Cross-service tests, E2E critical paths |
| 10 | [CI/CD & Deployment](lessons/10-ci-cd-and-deployment/) | GitHub Actions, Husky, cloud deploy | CI pipeline, deploy to cloud (free tiers) |

## Secret Santa Features

| Feature | Backend Lesson | Frontend Lesson | Fullstack Lesson |
|---------|---------------|-----------------|------------------|
| Register / Login | 08 (Auth) | 05-07 (Hooks, Router, API) | — |
| Create Room / Invite Code | 04 (NestJS) | 06-07 (Router, API) | — |
| Join Room | 04-05 (NestJS) | 07 (API) | — |
| Wishlists | 04-05 (NestJS) | 07 (API) | — |
| The Draw | — | — | 03 (Rooms & Draw) |
| Redis Caching | — | — | 04 (Redis) |
| Event-Driven Notifications | — | — | 05-06 (RabbitMQ, Notifications) |
| Real-Time Push | — | — | 07 (WebSockets) |
| Anonymous Messages | — | — | 08 (Anonymous Messaging) |
| Docker Infrastructure | — | — | 01 (Docker) |
| Deployment | — | — | 10 (CI/CD) |

## Infrastructure

All infrastructure runs via docker-compose at the repo root:

```
MongoDB       — port 27017 (persistent volume)
Redis         — port 6379  (persistent volume)
RabbitMQ      — port 5672  + 15672 (management UI)
santa-api     — port 3001
santa-notifications — port 3002
santa-app     — port 5173 (Vite dev server, runs locally)
```

## Deployment (Free Tiers)

| Service | Provider |
|---------|----------|
| santa-api + santa-notifications | Railway / Render |
| MongoDB | MongoDB Atlas (free 512MB) |
| Redis | Redis Cloud (free 30MB) |
| RabbitMQ | CloudAMQP (free Little Lemur) |
| santa-app | Vercel / Netlify |

## How to Work

1. Read the lesson **README.md** — understand the new concept
2. Follow the **step-by-step task** — implement the feature in the real apps
3. Test your implementation — run the apps, verify with curl/Postman/browser
4. Answer **QUESTIONS.md** for self-evaluation
5. Commit your progress
