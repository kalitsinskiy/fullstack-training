<!--
Secret Santa — final review PR (see Lesson 12: Code Review).
GitHub pre-fills this when you open a PR. Fill every section and tick the boxes.
Don't open the PR until the boxes are honestly checked.
-->

## What

<!-- One paragraph: what this PR delivers (the whole Secret Santa system). -->

## Live demo (Render)

<!-- Your deployed URLs. The client URL is what the reviewer opens first. -->

- 🎁 **Client (santa-app):** https://santa-app-XXXX.onrender.com
- santa-api health: https://santa-api-XXXX.onrender.com/api/health
- santa-notifications health: https://santa-notifications-XXXX.onrender.com/health

> Free Render services sleep when idle — the first request may take a few seconds to wake.

## How to run locally

<!-- e.g. `docker compose up -d` + the three apps (or the dev overlay). -->

## Deployment checklist

- [ ] santa-app is deployed and the **client URL above loads**
- [ ] santa-api `/api/health` returns `{ "status": "ok" }`
- [ ] santa-notifications `/health` returns `{ "status": "ok" }`
- [ ] `VITE_API_URL` / `VITE_WS_URL` point at the deployed backends (the frontend calls them, not its own origin)
- [ ] `CORS_ORIGIN` on **both** backends is the client URL
- [ ] **End-to-end works in prod:** register → create room → join with a 2nd account → run the draw → see the assignment → send an anonymous message → receive the real-time notification

## Tests & quality

- [ ] `npm run ci` is green (lint + type-check + test for all three apps)
- [ ] `npm audit` has no high/critical (or justified in **Notes** below)
- [ ] Semgrep / Sonar Quality Gate clean (or justified below)
- [ ] No secrets committed — only `.env.example`; `.env` is gitignored

## Security checklist (see Lesson 12)

- [ ] Every endpoint requires auth unless intentionally public; room actions are permission-gated; `/internal/*` is behind the service key
- [ ] All inputs are validated (class-validator DTOs / AJV schemas)
- [ ] Anonymous-messaging privacy holds — `santaId` is never sent to the client
- [ ] Prod connections use TLS (`mongodb+srv`, `amqps`); CORS is not `*`; no secrets/PII in logs

## Screenshots

<!-- Key screens / the real-time flow (a short GIF is welcome). -->

## Notes for the reviewer

<!-- Anything out of scope, known issues, or decisions you'd like to flag. -->
