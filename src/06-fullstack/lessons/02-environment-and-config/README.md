# Lesson 02: Environment & Config

## Quick Overview

Hard-coding database URLs, API keys, and secrets directly in source code is a recipe for disaster. Different environments (development, staging, production) need different values, and secrets committed to git are secrets shared with the world.

This lesson introduces the **12-factor app** approach to configuration: store everything environment-specific in environment variables, validate them on startup, and never commit secrets.

By the end of this lesson you will have:

- A validated configuration module in both backend services
- `.env.example` files documenting required variables (without real values)
- Vite environment variables for the frontend
- docker-compose passing environment variables to containers

---

## Key Concepts

### 1. The 12-Factor App -- Config

The [12-factor app methodology](https://12factor.net/config) states:

> **Store config in the environment.**

Config is everything that varies between deploys: database URLs, credentials, feature flags, external service endpoints. It should **not** live in code. It should come from environment variables.

Why:

- The same code artifact runs in dev, staging, and production -- only the env vars change.
- Secrets never touch the codebase or version control.
- Config can be changed without redeploying code.

### 2. dotenv in Node.js

The `dotenv` package reads a `.env` file and sets variables on `process.env`:

```
# .env
PORT=3001
NODE_ENV=development
MONGO_URL=mongodb://localhost:27017/santa
JWT_SECRET=my-dev-secret
JWT_EXPIRATION=7d
```

```typescript
import 'dotenv/config'; // Load .env into process.env

console.log(process.env.PORT);       // "3001"
console.log(process.env.MONGO_URL);  // "mongodb://localhost:27017/santa"
```

**Important:** `dotenv` is for local development only. In production (Docker, cloud), environment variables are injected by the platform. The `.env` file should never exist in production.

### 3. .env vs .env.example

| File | Committed to git? | Contains real values? | Purpose |
|------|-------------------|----------------------|---------|
| `.env` | **Never** | Yes | Local dev config with real secrets |
| `.env.example` | **Yes** | No (placeholders) | Documents required variables for other developers |

`.env.example`:

```
PORT=3001
NODE_ENV=development
MONGO_URL=mongodb://localhost:27017/santa
JWT_SECRET=<your-secret-here>
JWT_EXPIRATION=7d
```

A new developer clones the repo, copies `.env.example` to `.env`, fills in real values, and is ready to go.

### 4. Config Validation -- Fail Fast

If a required variable is missing, the app should **fail immediately on startup** with a clear error message. This is the "fail fast" principle. It is far better to crash at startup than to run for hours and fail at 3 AM when someone tries to authenticate and `JWT_SECRET` is `undefined`.

Pattern for validation:

```typescript
interface AppConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiration: string;
}

function validateConfig(): AppConfig {
  const errors: string[] = [];

  const port = parseInt(process.env.PORT || '', 10);
  if (isNaN(port)) errors.push('PORT must be a valid number');

  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) errors.push('NODE_ENV is required');

  const mongoUri = process.env.MONGO_URL;
  if (!mongoUri) errors.push('MONGO_URL is required');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) errors.push('JWT_SECRET is required');

  const jwtExpiration = process.env.JWT_EXPIRATION;
  if (!jwtExpiration) errors.push('JWT_EXPIRATION is required');

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.join('\n')}`
    );
  }

  return { port, nodeEnv: nodeEnv!, mongoUri: mongoUri!, jwtSecret: jwtSecret!, jwtExpiration: jwtExpiration! };
}
```

Alternatively, you can use libraries like `joi`, `zod`, or `class-validator` to define a schema and validate in one step.

### 5. NestJS ConfigModule

NestJS provides `@nestjs/config` which integrates dotenv with the module system:

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
        MONGO_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('7d'),
      }),
    }),
  ],
})
export class AppModule {}
```

Then inject `ConfigService` anywhere:

```typescript
@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }
}
```

### 6. Fastify Config Plugin

For raw Fastify (santa-notifications), use `@fastify/env` or write a custom plugin:

```typescript
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGO_URL: string;
}

const configPlugin = fp(async (fastify: FastifyInstance) => {
  const config: EnvConfig = {
    PORT: parseInt(process.env.PORT || '3002', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URL: process.env.MONGO_URL || '',
  };

  const missing: string[] = [];
  if (!config.MONGO_URL) missing.push('MONGO_URL');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  fastify.decorate('config', config);
});

export default configPlugin;
```

### 7. Vite Environment Variables

Vite has built-in support for `.env` files, but only variables prefixed with `VITE_` are exposed to client-side code. This is a security boundary -- server-only secrets should never start with `VITE_`.

```
# santa-app/.env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3002
```

Access in code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const wsUrl = import.meta.env.VITE_WS_URL;
```

For TypeScript type safety, declare the types in `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Important:** Anything accessible via `import.meta.env` is embedded into the client bundle at build time. Anyone can see it in the browser. Never put secrets in `VITE_` variables.

### 8. Environment Variables in Docker Compose

There are multiple ways to pass env vars to containers in compose:

```yaml
services:
  santa-api:
    build: ./santa-api
    environment:
      - PORT=3001
      - NODE_ENV=production
      - MONGO_URL=mongodb://mongodb:27017/santa
      - JWT_SECRET=${JWT_SECRET}  # Read from host .env or shell
    env_file:
      - ./santa-api/.env.docker  # Or load from a file
```

Using `${JWT_SECRET}` in `docker-compose.yml` pulls the value from:
1. The host shell environment, or
2. A `.env` file in the same directory as `docker-compose.yml`

This way secrets are not hard-coded in `docker-compose.yml`.

### 9. Environment-Specific Configuration

Different environments need different settings:

| Setting | Development | Staging | Production |
|---------|------------|---------|------------|
| `NODE_ENV` | development | staging | production |
| `MONGO_URL` | localhost:27017 | staging-cluster.mongodb.net | prod-cluster.mongodb.net |
| `JWT_EXPIRATION` | 30d (convenient) | 7d | 1d (strict) |
| Logging level | debug | info | warn |

The code stays the same. Only the environment variables change.

---

## Task

### Step 1: Create EnvService/config module for santa-api

1. Install `@nestjs/config` and `joi` if not already installed:
   ```bash
   cd santa-api && npm install @nestjs/config joi
   ```

2. Update `AppModule` to import `ConfigModule.forRoot()` with a Joi validation schema. Validate these variables:
   - `PORT` (number, default 3001)
   - `NODE_ENV` (string, one of: development / staging / production)
   - `MONGO_URL` (string, required)
   - `JWT_SECRET` (string, required)
   - `JWT_EXPIRATION` (string, default "7d")

3. Make `ConfigModule` global (`isGlobal: true`) so `ConfigService` is available everywhere without extra imports.

4. Replace any hard-coded config values in your existing code with `ConfigService` calls. For example, update your MongoDB connection to use `configService.get('MONGO_URL')`, and JWT configuration to use `configService.get('JWT_SECRET')`.

### Step 2: Extend the config plugin for santa-notifications

The template already ships `src/plugins/config.ts` — it reads `PORT` / `NODE_ENV`
and decorates `fastify.config`. **Extend** it (don't recreate it) to:

1. Also read `MONGO_URL` from `process.env`, and add it to the `AppConfig`
   interface + the decorated object.
2. Validate that required variables (`MONGO_URL`) are present; throw a clear error
   listing all missing variables if any are absent (so the service fails fast).
3. Keep it registered before the DB connection (it already is, in `app.ts`).
4. Update `src/db.ts` to read the URI from `fastify.config.MONGO_URL` instead of
   `process.env.MONGO_URL ?? '…'`.

### Step 3: Create .env.example files

Create `.env.example` in **santa-api/**:

```
PORT=3001
NODE_ENV=development
MONGO_URL=mongodb://localhost:27017/santa
JWT_SECRET=<your-secret-here>
JWT_EXPIRATION=7d
```

Create `.env.example` in **santa-notifications/**:

```
PORT=3002
NODE_ENV=development
MONGO_URL=mongodb://localhost:27017/santa
```

Create actual `.env` files (copy from examples) with your local values. Make sure `.env` is listed in `.gitignore` for all projects.

### Step 4: Set up Vite environment variables for santa-app

> **Already scaffolded.** The baseline ships `santa-app/.env.example`,
> `src/vite-env.d.ts`, and an axios client (`src/lib/api.ts`) that already reads
> `import.meta.env.VITE_API_URL`. **Verify** these match below rather than
> recreating them; just `cp .env.example .env`.

1. Confirm `santa-app/.env.example` contains:
   ```
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=http://localhost:3002
   ```

2. Create `santa-app/.env` with the same values for local development.

3. Add TypeScript type declarations in `santa-app/src/vite-env.d.ts`:
   ```typescript
   /// <reference types="vite/client" />

   interface ImportMetaEnv {
     readonly VITE_API_URL: string;
     readonly VITE_WS_URL: string;
   }

   interface ImportMeta {
     readonly env: ImportMetaEnv;
   }
   ```

4. Update your API client (axios instance or fetch wrapper) to use `import.meta.env.VITE_API_URL` as the base URL instead of a hard-coded string.

### Step 5: Update docker-compose.yml

Update the `docker-compose.yml` from Lesson 01 to pass environment variables properly:

1. Create a `.env` file at the **repo root** for shared Docker secrets:
   ```
   JWT_SECRET=your-docker-secret-here
   ```

2. Update service definitions in `docker-compose.yml`:
   ```yaml
   services:
     santa-api:
       environment:
         - PORT=3001
         - NODE_ENV=production
         - MONGO_URL=mongodb://mongodb:27017/santa
         - JWT_SECRET=${JWT_SECRET}
         - JWT_EXPIRATION=7d

     santa-notifications:
       environment:
         - PORT=3002
         - NODE_ENV=production
         - MONGO_URL=mongodb://mongodb:27017/santa
   ```

3. Add `.env` at the repo root to `.gitignore`.

### Step 6: Verify config validation

Test that validation catches missing variables:

1. Remove or unset a required variable (like `MONGO_URL`) and start the service.
2. Confirm the app crashes immediately with a clear error message listing the missing variable.
3. Restore the variable and verify the service starts normally.

---

## Verification

```bash
# 1. Test santa-api fails fast with missing config
cd santa-api
MONGO_URL= JWT_SECRET= npx ts-node src/main.ts
# Expected: Throws error about missing required variables

# 2. Test santa-notifications fails fast
cd santa-notifications
MONGO_URL= npx ts-node src/server.ts
# Expected: Throws error about missing MONGO_URL

# 3. Normal startup works with valid .env
cd santa-api && npm run start:dev
# Expected: Starts successfully, logs config values (never log secrets!)

# 4. Docker-compose injects env vars
docker-compose up --build
docker-compose exec santa-api printenv | grep MONGO_URL
# Expected: MONGO_URL=mongodb://mongodb:27017/santa

# 5. Vite env vars work
cd santa-app && npm run dev
# In browser console: console.log(import.meta.env.VITE_API_URL)
# Expected: "http://localhost:3001"

# 6. .env files are not tracked by git
git status
# .env files should NOT appear in tracked or staged files
```
