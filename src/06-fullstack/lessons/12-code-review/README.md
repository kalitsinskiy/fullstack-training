# Lesson 12: Code Review

## Quick Overview

The whole app is built and deployed. This final core lesson is about getting it
**reviewed by a human** — the way it works on a real team. You'll open **one pull
request with the entire system** and a reviewer (your instructor) will read it.

This is **not** a tutorial PR with step-by-step commentary. It's a production PR:
a clean diff, a clear description, green checks, and code that survives a careful
read. Before you ask for review you run **static analysis and security scans**,
fix what they find, and **self-review** against the checklists below.

> **Goal:** open a PR of the Secret Santa system that a senior engineer would
> approve — and learn to read code critically by being on both sides of a review.

---

## Key Concepts

### What a good pull request looks like

A reviewer's time is the scarce resource. A good PR respects it:

- **Scoped branch → PR against an agreed base.** Your deploy branch
  (`deploy/<you>`) or a dedicated `review/<you>` branch, opened against the base
  your instructor names (e.g. `main` or a `review` branch).
- **A description that answers _what / why / how to run / what's risky_** — not a
  changelog of commits. Include how to run it, screenshots/GIFs of the UI, and
  anything out of scope.
- **A small, clean diff.** No commented-out code, `console.log`, debugging
  leftovers, `.env`, `node_modules/`, or `dist/`. Only `.env.example` is committed.
- **Green checks.** Lint, type-check, and tests pass (`npm run ci`), commits
  follow Conventional Commits.

### Self-review before you request review

Read your own diff on GitHub, file by file, as if it were someone else's. Fix the
obvious things so the reviewer can focus on what matters:

- **Naming & structure** — intent-revealing names; one responsibility per
  module/function; consistent with the surrounding code.
- **No duplication** — shared logic extracted, not copy-pasted.
- **Error handling** — no swallowed errors; consistent API error shape; no raw
  stack traces leaked to clients.
- **Types** — no stray `any` / `@ts-ignore` without a reason; DTOs/schemas typed.
- **No noise** — no `console.log`, dead code, unused imports/vars, or stale TODOs.
- **Tests** — cover happy path, edge cases, and auth/permission failures; they're
  green and not skipped.
- **Secrets** — nothing hardcoded; `.env.example` is up to date.

### Static analysis & free tooling

Let machines catch the mechanical issues before a human looks. All of these have a
free tier (and most are free forever for public repos):

| Tool | What it finds | Run it |
|---|---|---|
| **ESLint + Prettier** | style, bug-prone patterns (already in the gate) | `npm run lint` per app |
| **tsc** (type-check) | type errors | `npm run type-check` per app |
| **npm audit** | known CVEs in dependencies | `npm audit` (each app) |
| **Semgrep** | security + quality patterns, multi-language | `npx semgrep --config auto` |
| **Knip / depcheck / ts-prune** | dead code, unused deps/exports | `npx knip` |
| **SonarCloud** | smells, duplication, coverage, security hotspots, a Quality Gate | see below |
| **CodeQL** | deep security dataflow analysis | GitHub → Security → Code scanning (free for public) |
| **Snyk** | dependency + code vulnerabilities | `npx snyk test` (free tier) |

> **License check (matters on a real team):** new dependencies must be
> license-compatible — don't pull GPL code into a proprietary module. `npx
> license-checker --summary` lists what you've added.

### SonarQube / SonarCloud (since you asked)

**SonarCloud** (hosted, free for public repos) is the easy path:

1. [sonarcloud.io](https://sonarcloud.io) → **Log in with GitHub** → import the repo.
2. Choose **Automatic Analysis** (zero-config) — Sonar scans on each push and
   posts a **Quality Gate** result on your PR (bugs, vulnerabilities, code smells,
   duplication, coverage).
3. Optional: add a `sonar-project.properties` to tune sources/exclusions, and
   feed it your coverage report (`lcov`) so Sonar shows real coverage.

Prefer **self-hosted**? Run **SonarQube Community** locally and scan:

```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:community   # http://localhost:9000
npx sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.token=<token>
```

Either way, the deliverable is the same: a **green Quality Gate** on the PR, or a
short note explaining any issue you consciously accepted.

### Security review (for this stack)

Go through the system with an attacker's eye. The checklist, mapped to our code:

- **Secrets** — no hardcoded keys/tokens; `.env` gitignored; `JWT_SECRET` and
  `SERVICE_API_KEY` come from env and are strong/unique per environment.
- **AuthN / AuthZ** — every route requires auth unless deliberately public; room
  actions are **permission-gated** (`RoomPermissionsGuard`); `/internal/*` is
  behind the **service key**, never reachable with a user token.
- **Input validation** — every inbound payload is validated: `class-validator`
  DTOs (santa-api) and AJV schemas (santa-notifications). No endpoint trusts the
  body/query as-is.
- **Injection** — queries go through Mongoose with typed filters; no string-built
  queries, no passing a raw client-supplied object straight into a filter.
- **Privacy invariant** — the anonymous-messaging mediator never sends `santaId`
  to the client; verify it isn't leaked in any response or socket payload.
- **Rate limiting** — global throttler + the stricter auth limiter are in place.
- **Transport** — production connection strings use TLS (`mongodb+srv`, `amqps`;
  `redis` where the tier allows). TLS verification is never disabled.
- **HTTP hardening** — security headers (Helmet/CSP) on; CORS restricted to the
  known frontend origin (not `*`).
- **Safe logging** — no passwords, tokens, or message contents in logs.
- **Error responses** — generic messages to clients (e.g. login returns the same
  401 for wrong password and unknown email); internals never leaked.
- **Dependencies** — `npm audit` clean of high/critical; licenses compatible.

> Reference frame: the **OWASP Top 10**. For each item, ask "could this app be hit
> by it, and what stops it?" — then point to the code that stops it (or fix it).

### How your reviewer will read it (rubric)

Your instructor reads the PR roughly along these axes — know it so you can pre-empt it:

| Dimension | What earns a ✅ |
|---|---|
| **Correctness** | features work; edge cases handled; matches the API contracts |
| **Tests** | meaningful coverage (happy + edge + auth), green, not skipped |
| **Security** | the checklist above holds; no secrets; validated inputs |
| **Readability** | clear names, small functions, consistent with the codebase |
| **Conventions** | lint/type-check/commits clean; structure matches the lessons |
| **Error handling** | no swallowed errors; consistent shapes; nothing leaked |
| **PR hygiene** | scoped diff, clear description, responsive to comments |

---

## Task

> No step-by-step here either — this lesson is about producing and defending a
> real PR. Use the checklists above as your guide.

### Step 1 — Prepare the branch

- Put the system on a clean branch (your `deploy/<you>`, or a fresh `review/<you>`).
- Make the gate green: from the repo root run `npm run ci` (lint + type-check +
  test for all three apps). Don't open the PR until it's green.
- Strip the noise: `console.log`, dead code, stray TODOs, anything `.env`.

### Step 2 — Run the scanners and fix what they flag

```bash
# dependencies (run in each app)
cd santa-api && npm audit            # repeat for santa-notifications, santa-app

# security + quality patterns (whole repo)
npx semgrep --config auto

# dead code / unused deps (optional, per app)
npx knip
```

Plus SonarCloud (or local SonarQube) for the Quality Gate. Fix **high/critical**
findings; for anything you intentionally leave, write a one-line justification in
the PR.

### Step 3 — Self-review

Open the diff on GitHub and read it yourself, file by file, against the
**security** and **self-review** checklists. Fix before you assign a reviewer.

### Step 4 — Open the pull request

Open it against the base your instructor names. GitHub **pre-fills the PR body**
from the repo's [`.github/pull_request_template.md`](../../../../.github/pull_request_template.md) —
fill **every** section and tick the boxes honestly. In particular:

- **Live demo (Render):** paste your deployed **client URL** (santa-app) — it's
  the first thing the reviewer opens — plus the two backend `/health` URLs.
- **Deployment checklist:** prove the whole flow works in prod (register → room →
  join → draw → assignment → anonymous message → real-time notification).
- **Tests & quality:** `npm run ci` green; `npm audit` / Semgrep / Sonar clean
  (or justified in *Notes*); no secrets, only `.env.example`.
- **Security checklist:** the Lesson 12 items hold (authz, validation, the
  `santaId` privacy invariant, TLS, CORS, logging).

Then **assign your instructor as the reviewer**.

### Step 5 — Respond to the review

- Reply to every comment; push fixes as new commits to the **same branch**
  (avoid force-push during review so the reviewer can see what changed).
- Resolve threads once addressed; re-request review when ready.
- Treat disagreement as a discussion, not a verdict — explain your reasoning,
  and be willing to change it.

## Verification — Definition of Done

The PR is ready when:

- [ ] CI gate is green (`npm run ci`) and commits are conventional
- [ ] `npm audit` has no high/critical (or they're justified in the PR)
- [ ] Semgrep / Sonar Quality Gate is clean (or noted)
- [ ] The security checklist holds (secrets, authz, validation, transport, logging)
- [ ] The diff is clean (no `.env`, `node_modules/`, `dist/`, `console.log`, dead code)
- [ ] The PR description is complete and the instructor is assigned as reviewer

## Learn More

- [Google Engineering Practices — Code Review](https://google.github.io/eng-practices/review/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SonarCloud docs](https://docs.sonarsource.com/sonarcloud/) · [Semgrep](https://semgrep.dev/docs/) · [CodeQL](https://codeql.github.com/)
- [npm audit](https://docs.npmjs.com/cli/commands/npm-audit) · [Snyk](https://docs.snyk.io/) · [Knip](https://knip.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)
