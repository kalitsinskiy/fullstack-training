# Lesson 11: CI/CD and Deployment

## Quick Overview

Code that is not deployed is not delivering value. This final lesson ties everything together: we add Git hooks (Husky) to catch issues before they reach the remote, enforce conventional commits with commitlint, run a **local CI gate** on pre-push (lint + type-check + test), set up managed cloud services (MongoDB Atlas, Redis Cloud, CloudAMQP), and **deploy all three apps manually from your own machine** using your own free-tier accounts. No shared hosted pipeline — each of you ships independently.

## Key Concepts

### Git Hooks with Husky

Git hooks are scripts that run automatically at specific points in the Git workflow. **Husky** makes managing them easy:

```bash
# Install Husky
npm install -D husky
npx husky init
```

This creates a `.husky/` directory at the repo root. Add hooks:

```bash
# .husky/pre-commit -- runs before every commit
npm run lint

# .husky/pre-push -- runs before every push
npm run type-check
npm test
```

**How it works:**
- `pre-commit` runs before `git commit` completes. If the script exits with a non-zero code, the commit is aborted.
- `pre-push` runs before `git push`. If it fails, the push is aborted.

```bash
$ git commit -m "feat: add notifications"
> Running pre-commit hook...
> npm run lint
> ✓ Lint passed
> Commit created: abc1234

$ git push
> Running pre-push hook...
> npm run type-check
> ✓ Type check passed
> npm test
> ✓ 42 tests passed
> Pushed to origin/main
```

**Tip**: Use `lint-staged` alongside Husky to only lint files that are staged, not the entire codebase:

```bash
npm install -D lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix"],
    "*.{ts,tsx,json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

### Commitlint (Conventional Commits)

Conventional Commits enforce a consistent commit message format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, dependencies |
| `ci` | CI/CD configuration |
| `perf` | Performance improvement |

```bash
# Good
feat(auth): add JWT refresh token rotation
fix(rooms): prevent duplicate room joins
docs: update API documentation for notifications endpoint
test(messages): add integration tests for anonymous messaging

# Bad
update stuff
fixed bug
WIP
```

Install and configure:

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

```bash
# .husky/commit-msg
npx --no -- commitlint --edit "$1"
```

Now `git commit -m "update stuff"` will be rejected with a helpful error.

### Local CI — your pre-push gate

We deliberately **keep CI local**. A hosted pipeline (GitHub Actions) lives on
one repo's settings and secrets; in this course everyone works on their own
fork/branch with their own cloud accounts, so a shared pipeline doesn't fit.
Instead, the `pre-push` hook **is** your CI: it runs lint, type-check, and tests
before anything leaves your machine, so you never push broken code.

```bash
# .husky/pre-push — runs before every `git push`
set -e
for app in santa-api santa-notifications santa-app; do
  echo "▶ $app"
  ( cd "$app" && npm run lint && npm run type-check && npm test )
done
```

```
  git push
     |
     v
  pre-push hook (local)
     |
     +── lint ──┐
     +── type-check ──┤  (per app: santa-api, santa-notifications, santa-app)
     +── test ──┘
     |
     v
  all green → push proceeds   |   any red → push aborted
```

The flow mirrors what a hosted CI would do — lint → type-check → test — but it
runs in seconds on your machine with no shared infrastructure. If you later move
to a team repo, the same three commands drop straight into a GitHub Actions
workflow unchanged.

### Deployment Platforms

| Platform | Best for | Free tier | Key features |
|---|---|---|---|
| **Railway** | Backend services | $5 credit/month | Monorepo support, auto-deploy from Git, managed databases |
| **Render** | Backend services | 750 hrs/month | Free web services (spin down after inactivity), managed databases |
| **Fly.io** | Backend with regions | 3 shared VMs free | Global edge deployment, Docker-based |
| **Vercel** | Frontend (React/Next) | Generous free tier | Automatic preview deploys, CDN, zero-config for Vite |
| **Netlify** | Frontend (static/SPA) | 100GB bandwidth/month | Build plugins, form handling, CDN |

**Recommended setup for Secret Santa:**
- **santa-api** + **santa-notifications**: Railway or Render
- **santa-app**: Vercel (best DX for Vite/React)
- **MongoDB**: MongoDB Atlas (free M0 cluster, 512MB)
- **Redis**: Redis Cloud (free tier, 30MB)
- **RabbitMQ**: CloudAMQP (Little Lemur plan, free)

### Managed Services

**MongoDB Atlas** (free tier):

```
1. Go to mongodb.com/atlas
2. Create a free cluster (M0 Sandbox, 512MB)
3. Set up database user (username + password)
4. Whitelist IP addresses (or allow 0.0.0.0/0 for any)
5. Get connection string: mongodb+srv://user:pass@cluster.abc123.mongodb.net/santa-api
```

**Redis Cloud** (free tier):

```
1. Go to redis.com/cloud
2. Create a free database (30MB)
3. Get connection string: redis://default:password@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345
```

**CloudAMQP** (free tier):

```
1. Go to cloudamqp.com
2. Create a new instance (Little Lemur plan - free)
3. Get AMQP URL: amqps://user:pass@moose.rmq.cloudamqp.com/user
```

### Environment Variables in Production

**Never commit secrets to Git.** Use the deployment platform's environment variable management:

```bash
# Railway (via CLI)
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="strong-random-secret-here"
railway variables set REDIS_URL="redis://..."
railway variables set RABBITMQ_URL="amqps://..."
railway variables set SERVICE_API_KEY="production-service-key"

# Or via the Railway/Render web dashboard: Settings > Environment Variables
```

For santa-app on Vercel:

```bash
# Vercel dashboard: Settings > Environment Variables
VITE_API_URL=https://santa-api-production.railway.app
VITE_WS_URL=https://santa-notifications-production.railway.app
```

**Important**: `VITE_` variables are embedded in the client bundle at build time. They are not secret. Only use them for public URLs.

### Health Checks and Monitoring

Add health check endpoints to both backend services:

```typescript
// santa-api health check
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

```typescript
// santa-notifications health check (Fastify)
fastify.get('/health', async () => {
  // Check MongoDB connection
  const mongoOk = mongoose.connection.readyState === 1;

  // Check Redis connection
  let redisOk = false;
  try {
    await redisClient.ping();
    redisOk = true;
  } catch {}

  const status = mongoOk && redisOk ? 'ok' : 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoOk ? 'connected' : 'disconnected',
      redis: redisOk ? 'connected' : 'disconnected',
    },
  };
});
```

Configure your deployment platform to ping `/health` every 30 seconds. If it fails, the platform can restart the service.

### Deployment Checklist

Before deploying to production, verify:

- [ ] All tests pass in CI
- [ ] Environment variables are set (no hardcoded secrets)
- [ ] CORS origins are configured for production URLs
- [ ] MongoDB indexes are created
- [ ] Health check endpoint responds
- [ ] Error logging is configured (no `console.log` in production)
- [ ] Rate limiting is enabled on auth endpoints
- [ ] JWT secret is strong and unique per environment
- [ ] `.env` files are in `.gitignore`
- [ ] `NODE_ENV=production` is set

## Task

### Step 1: Add Husky to the Repo

```bash
# From the repo root
npm install -D husky lint-staged
npx husky init
```

Create the pre-commit hook:

```bash
# .husky/pre-commit
npx lint-staged
```

Create a placeholder pre-push hook (Step 3 turns it into the full CI gate):

```bash
# .husky/pre-push
echo "pre-push: CI gate is wired up in Step 3"
```

Configure lint-staged in the root `package.json`:

```json
{
  "lint-staged": {
    "santa-api/**/*.ts": ["eslint --fix"],
    "santa-notifications/**/*.ts": ["eslint --fix"],
    "santa-app/**/*.{ts,tsx}": ["eslint --fix"]
  }
}
```

### Step 2: Add Commitlint

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

Create `commitlint.config.js` at the repo root:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci', 'perf'],
    ],
    'subject-max-length': [2, 'always', 72],
  },
};
```

Add the commit-msg hook:

```bash
# .husky/commit-msg
npx --no -- commitlint --edit "$1"
```

Test it:

```bash
git commit -m "update stuff"
# Should fail: "type must be one of [feat, fix, ...]"

git commit -m "feat: add husky and commitlint"
# Should pass
```

### Step 3: Local CI in the pre-push hook

Your `pre-push` hook **is** your CI gate. It runs lint, type-check, and tests
for all three apps before any push leaves your machine — no hosted pipeline,
no shared secrets, works the same on everyone's fork. Replace `.husky/pre-push`:

```bash
set -e

for app in santa-api santa-notifications santa-app; do
  echo "▶ CI: $app"
  ( cd "$app" && npm run lint && npm run type-check && npm test )
done
```

A broken push is now stopped locally:

```bash
git push
# ▶ CI: santa-api … ✓
# ▶ CI: santa-notifications … ✓
# ▶ CI: santa-app … ✓        → push proceeds
# (any failure exits non-zero and aborts the push)
```

> **Keep the gate fast.** Scope the hook to lint + type-check + **unit** tests
> (`test:unit`). Suites that need infrastructure — `mongodb-memory-server`
> (downloads a binary on first run) and the Playwright e2e flow (needs the whole
> stack up) — are run **manually before a deploy**, not on every push.
>
> If you ever move to a shared team repo, these same three commands lift
> straight into a GitHub Actions workflow unchanged — but that's out of scope
> here: in this course each of you ships independently from your own machine.

### Step 4: Set Up Managed Services

> **Your own accounts, your own `.env`.** Everyone provisions their **own**
> free-tier services and keeps their connection strings in their **own**
> untracked `.env` files. Nothing here is shared, and secrets never go in git
> (`.env` is gitignored; commit only `.env.example`).

Create free-tier accounts and get connection strings for:

1. **MongoDB Atlas**: Create an M0 cluster. Whitelist `0.0.0.0/0` (allow from anywhere) for simplicity. Create a database user. Copy the connection string.

2. **Redis Cloud**: Create a free database. Copy the public endpoint and password.

3. **CloudAMQP**: Create a Little Lemur instance. Copy the AMQP URL.

Save the connection strings -- you will need them for Step 6.

### Step 5: Deploy Backend Services

Deploy santa-api and santa-notifications to Railway (or Render):

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy santa-api
cd santa-api
railway init
railway up

# Deploy santa-notifications
cd ../santa-notifications
railway init
railway up
```

Or use the Railway web dashboard:
1. Connect your GitHub repo
2. Select the subdirectory for each service
3. Railway will auto-detect Node.js and build

### Step 6: Deploy Frontend

Deploy santa-app to Vercel:

```bash
npm install -g vercel
cd santa-app
vercel
```

Or connect your GitHub repo in the Vercel dashboard:
1. Import project
2. Set root directory to `santa-app`
3. Framework preset: Vite
4. Add environment variables: `VITE_API_URL` and `VITE_WS_URL`

### Step 7: Configure Production Environment Variables

Set environment variables on each platform:

**santa-api (Railway):**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
RABBITMQ_URL=amqps://...
JWT_SECRET=<generate with: openssl rand -base64 32>
SERVICE_API_KEY=<generate with: openssl rand -base64 32>
CORS_ORIGIN=https://your-santa-app.vercel.app
```

**santa-notifications (Railway):**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
RABBITMQ_URL=amqps://...
JWT_SECRET=<same as santa-api>
SERVICE_API_KEY=<same as santa-api>
SANTA_API_URL=https://santa-api-production.railway.app
CORS_ORIGIN=https://your-santa-app.vercel.app
```

**santa-app (Vercel):**
```
VITE_API_URL=https://santa-api-production.railway.app
VITE_WS_URL=https://santa-notifications-production.railway.app
```

### Step 8: Verify the Deployed Application

Test the full end-to-end flow on production:

1. Open your Vercel URL in the browser
2. Register a new account
3. Create a room
4. Share the invite code with a friend (or use an incognito window)
5. Join the room with the second account
6. Run the draw
7. Send an anonymous message
8. Verify notifications and real-time updates work

## Verification

Test Husky hooks locally:

```bash
# Test commitlint
git commit -m "bad message"
# Expected: rejected by commitlint

git commit -m "feat: add ci/cd configuration"
# Expected: passes commitlint, runs lint-staged

# Test the local CI gate (pre-push)
git push
# Expected: "▶ CI: santa-api / santa-notifications / santa-app" — lint,
# type-check, and unit tests run for each app before the push proceeds.
# Introduce a lint error and confirm the push is aborted.
```

Test deployed services:

```bash
# Health checks
curl https://santa-api-production.railway.app/health
# Expected: { "status": "ok", ... }

curl https://santa-notifications-production.railway.app/health
# Expected: { "status": "ok", "services": { "mongodb": "connected", "redis": "connected" } }

# Test auth flow
curl -X POST https://santa-api-production.railway.app/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"prod-test@example.com","password":"password123","displayName":"Prod Test"}'
# Expected: { "accessToken": "..." }
```

Open the deployed frontend and complete the full Secret Santa flow: register, create room, invite friends, draw names, send anonymous messages, receive real-time notifications.

## Learn More

- [Husky Documentation](https://typicode.github.io/husky/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [commitlint](https://commitlint.js.org/)
- [Git hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [The Twelve-Factor App](https://12factor.net/)
