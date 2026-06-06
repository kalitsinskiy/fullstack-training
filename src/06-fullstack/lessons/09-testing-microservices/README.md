# Lesson 09: Testing Microservices

## Quick Overview

Testing a monolith is straightforward: one database, one process, one test suite. Microservices multiply the challenge -- you have multiple databases, async message flows, and cross-service dependencies. This lesson covers integration testing strategies for santa-api and santa-notifications independently, testing event-driven flows across services, component testing the React frontend, and setting up proper test environments.

## Key Concepts

### Testing Microservices Challenges

| Challenge | Why it is hard | Strategy |
|---|---|---|
| Multiple databases | Each service owns its data | Separate test databases per service |
| Async event flows | RabbitMQ events are fire-and-forget | Publish event, then poll/wait for side effect |
| Service dependencies | Service A calls Service B over HTTP | Mock HTTP calls or run both services |
| Shared state | Redis cache, message queues | Clean between tests |
| Test isolation | Tests must not affect each other | Reset DB before each test or use transactions |

### Integration Testing Strategy

Test each service **independently** with real infrastructure (MongoDB, Redis, RabbitMQ) but mock cross-service HTTP calls:

```
santa-api integration tests:
  [Test] -> [santa-api] -> [MongoDB (test DB)] -> [RabbitMQ (test vhost)]
                              real                    real

santa-notifications integration tests:
  [Test] -> [santa-notifications] -> [MongoDB (test DB)] -> [RabbitMQ (test vhost)]
                                        real                    real
            santa-api HTTP calls -> [mocked]
```

### Test Environment Setup

Create separate environment files for testing:

```bash
# santa-api/.env.test
NODE_ENV=test
PORT=3011
MONGODB_URI=mongodb://localhost:27017/santa-api-test
REDIS_URL=redis://localhost:6379/1
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=test-secret
```

```bash
# santa-notifications/.env.test
NODE_ENV=test
PORT=3012
MONGODB_URI=mongodb://localhost:27017/santa-notifications-test
REDIS_URL=redis://localhost:6379/2
RABBITMQ_URL=amqp://localhost:5672
SANTA_API_URL=http://localhost:3011
SERVICE_API_KEY=test-service-key
JWT_SECRET=test-secret
```

**Key points:**
- Different MongoDB database names (`-test` suffix)
- Different Redis database numbers (`/1`, `/2`)
- Different ports to avoid conflicts with dev servers

### Test Setup and Teardown

```typescript
// santa-api/test/setup.ts
import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.test' });

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
});

afterEach(async () => {
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
```

Configure Jest (or Vitest) to use this setup file:

```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./test/setup.ts'],
  testMatch: ['**/test/**/*.test.ts'],
  testTimeout: 15000, // increase for integration tests
};
```

### Testing Full Flows in santa-api

Integration tests should cover complete user flows, not isolated units:

```typescript
// santa-api/test/auth-flow.test.ts
import { app } from '../src/app'; // your NestJS or Fastify app

describe('Auth Flow', () => {
  let server: any;

  beforeAll(async () => {
    server = await app.listen({ port: 0 }); // random port
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register, login, and access protected routes', async () => {
    // 1. Register
    const registerRes = await fetch(`${server.url}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      }),
    });
    expect(registerRes.status).toBe(201);
    const { accessToken } = await registerRes.json();
    expect(accessToken).toBeDefined();

    // 2. Login with same credentials
    const loginRes = await fetch(`${server.url}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.accessToken).toBeDefined();

    // 3. Access protected route with token
    const roomsRes = await fetch(`${server.url}/rooms`, {
      headers: { Authorization: `Bearer ${loginData.accessToken}` },
    });
    expect(roomsRes.status).toBe(200);

    // 4. Access without token should fail
    const unauthRes = await fetch(`${server.url}/rooms`);
    expect(unauthRes.status).toBe(401);
  });
});
```

### Testing Event-Driven Flows

The trickiest part of microservice testing: verifying that publishing an event in one service causes a side effect in another.

```typescript
// santa-notifications/test/event-flow.test.ts
import amqp from 'amqplib';
import { Notification } from '../src/models/notification';

describe('Event-Driven Flow', () => {
  let connection: amqp.Connection;
  let channel: amqp.Channel;

  beforeAll(async () => {
    connection = await amqp.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();
    await channel.assertExchange('events', 'topic', { durable: true });
  });

  afterAll(async () => {
    await channel.close();
    await connection.close();
  });

  it('should create notifications when draw.completed event is published', async () => {
    // Publish event
    const event = {
      type: 'draw.completed',
      roomId: 'room-123',
      participants: ['user-1', 'user-2', 'user-3'],
    };

    channel.publish(
      'events',
      'draw.completed',
      Buffer.from(JSON.stringify(event)),
    );

    // Wait for async processing (poll with timeout)
    const notifications = await waitFor(async () => {
      const results = await Notification.find({ roomId: 'room-123' });
      if (results.length < 3) throw new Error('Not yet');
      return results;
    }, 5000);

    expect(notifications).toHaveLength(3);
    expect(notifications[0].type).toBe('draw.completed');
    expect(notifications[0].title).toContain('Draw Complete');
  });
});

// Helper: poll until condition is met or timeout
async function waitFor<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 5000,
  intervalMs: number = 100,
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      return await fn();
    } catch {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  return fn(); // final attempt -- will throw if still failing
}
```

### Contract Testing Basics

When service A expects a certain response shape from service B, you need to ensure both sides agree. **Contract testing** verifies this without running both services together.

```typescript
// The "contract" -- what santa-notifications expects from santa-api
interface UserContract {
  id: string;
  displayName: string;
  email: string;
}

// In santa-api tests: verify the actual endpoint matches the contract
describe('User API Contract', () => {
  it('GET /users/:id should return the expected shape', async () => {
    // Create a user, then fetch
    const res = await fetch(`${server.url}/users/${userId}`, {
      headers: { 'X-Service-Key': 'test-service-key' },
    });
    const user = await res.json();

    // Verify the shape matches what consumers expect
    expect(user).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        displayName: expect.any(String),
        email: expect.any(String),
      }),
    );
  });
});
```

For more rigorous contract testing, tools like [Pact](https://pact.io/) automate this: the consumer defines expected interactions, and the provider verifies them.

### React Component Testing

Test frontend components with mocked API calls using Vitest and React Testing Library:

```tsx
// santa-app/src/pages/__tests__/RoomListPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { RoomListPage } from '../RoomListPage';
import * as apiModule from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = apiModule.api as { get: ReturnType<typeof vi.fn> };

describe('RoomListPage', () => {
  it('should display rooms after loading', async () => {
    mockApi.get.mockResolvedValue([
      { id: '1', name: 'Office Party', code: 'ABC123', members: [] },
      { id: '2', name: 'Family Gift', code: 'DEF456', members: [] },
    ]);

    render(
      <MemoryRouter>
        <RoomListPage />
      </MemoryRouter>,
    );

    // Initially shows loading
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // After loading, shows room names
    await waitFor(() => {
      expect(screen.getByText('Office Party')).toBeInTheDocument();
      expect(screen.getByText('Family Gift')).toBeInTheDocument();
    });
  });

  it('should show error message when API fails', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <RoomListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no rooms exist', async () => {
    mockApi.get.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <RoomListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/no rooms/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Testing Strategy

End-to-end tests are expensive but verify critical paths work across the entire stack:

```
[Playwright/Cypress] -> [santa-app :5173] -> [santa-api :3001] -> [MongoDB]
                                           -> [santa-notifications :3002] -> [RabbitMQ]
```

**Focus E2E tests on critical user journeys:**
1. Register and login
2. Create a room and share the invite code
3. Join a room with an invite code
4. Run the draw
5. View assignment
6. Send and receive anonymous messages

Keep E2E tests minimal (5-10 tests) -- they are slow and brittle. Use integration tests for edge cases.

## Task

### Step 1: Set Up Test Environment

Create `.env.test` files for both santa-api and santa-notifications with separate database names and ports (see examples above).

Install test dependencies:

```bash
# In santa-api
npm install -D jest ts-jest @types/jest supertest @types/supertest

# In santa-notifications
npm install -D jest ts-jest @types/jest

# In santa-app
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Create `test/setup.ts` in each backend service with MongoDB connection, cleanup, and teardown logic.

### Step 2: santa-api Integration Tests

Create the following test files:

**test/auth.test.ts** -- Test the complete auth flow:
- Register a new user (verify 201 + token returned)
- Register with duplicate email (verify 409)
- Login with correct credentials (verify 200 + token)
- Login with wrong password (verify 401)
- Access a protected route without a token (verify 401)

**test/rooms.test.ts** -- Test the rooms flow:
- Create a room (verify room object with invite code)
- List rooms for the current user
- Join a room by invite code
- Join a room you are already in (verify 409 or appropriate handling)
- Run the draw (verify assignments are created)
- Get your assignment

```typescript
// test/rooms.test.ts (skeleton)
describe('Rooms Flow', () => {
  let aliceToken: string;
  let bobToken: string;
  let charlieToken: string;
  let roomId: string;
  let inviteCode: string;

  beforeAll(async () => {
    // Register three users and get their tokens
    aliceToken = await registerAndGetToken('alice@test.com');
    bobToken = await registerAndGetToken('bob@test.com');
    charlieToken = await registerAndGetToken('charlie@test.com');
  });

  it('Alice creates a room', async () => {
    const res = await request(app)
      .post('/rooms')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Test Room' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Room');
    expect(res.body.code).toBeDefined();
    roomId = res.body.id;
    inviteCode = res.body.code;
  });

  it('Bob and Charlie join the room', async () => {
    // Bob joins
    // Charlie joins
    // Verify both are in members list
  });

  it('Alice draws names', async () => {
    // POST /rooms/:id/draw
    // Verify 200
  });

  it('Each user gets their assignment', async () => {
    // GET /rooms/:id/assignment for each user
    // Verify each gets an assignedTo that is not themselves
    // Verify all participants are assigned exactly once
  });
});
```

### Step 3: santa-notifications Integration Tests

**test/notifications.test.ts** -- Test notification CRUD:
- Create a notification directly in the database, then fetch via API
- Mark a notification as read
- Pagination: create 25 notifications, verify page 1 returns 20 and page 2 returns 5
- Cannot read another user's notifications

**test/events.test.ts** -- Test that consuming a RabbitMQ event creates a notification:
- Publish a `draw.completed` event with 3 participants
- Wait for notifications to appear in MongoDB
- Verify notification content matches the event

### Step 4: Cross-Service Flow Test

Create a test that verifies the complete flow across services:

```typescript
// test/cross-service.test.ts
describe('Cross-Service: Draw Notification Flow', () => {
  it('publishing draw.completed creates notifications', async () => {
    // 1. Publish draw.completed event to RabbitMQ
    channel.publish('events', 'draw.completed', Buffer.from(JSON.stringify({
      type: 'draw.completed',
      roomId: 'room-abc',
      participants: ['user-1', 'user-2'],
    })));

    // 2. Wait and verify notifications were created
    await waitFor(async () => {
      const notifications = await Notification.find({ roomId: 'room-abc' });
      expect(notifications).toHaveLength(2);
    }, 5000);

    // 3. Verify via API
    const res = await fetch(`http://localhost:${TEST_PORT}/notifications`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].type).toBe('draw.completed');
  });
});
```

### Step 5: santa-app Component Tests

Test key pages with mocked API responses. Create:

**src/pages/\_\_tests\_\_/LoginPage.test.tsx** -- Test:
- Renders email and password fields
- Shows validation error for empty fields
- Calls API on submit and redirects on success
- Shows error message on API failure

**src/pages/\_\_tests\_\_/RoomListPage.test.tsx** -- Test:
- Shows loading spinner initially
- Renders room list after API resolves
- Shows empty state when no rooms
- Shows error on API failure

**src/pages/\_\_tests\_\_/RoomDetailPage.test.tsx** -- Test:
- Shows room name and members
- Shows the draw button for the room owner
- Shows assignment after draw

### Step 6: Add Test Scripts

```json
// santa-api/package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:integration": "jest --config jest.integration.config.ts",
    "test:cov": "jest --coverage"
  }
}

// santa-notifications/package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:integration": "jest --config jest.integration.config.ts"
  }
}

// santa-app/package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:cov": "vitest run --coverage"
  }
}
```

### Step 7: Playwright E2E — the full UI journey

This is the one test that exercises **everything at once** through the real
browser UI: registration, room creation, a second participant joining, the
draw, the assignment reveal, and an anonymous message. It needs the whole stack
up (`docker compose up -d`, all three apps running).

Install Playwright in `santa-app` (already in `devDependencies` of the baseline):

```bash
cd santa-app
npm install -D @playwright/test
npx playwright install chromium
```

`santa-app/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Spin up the dev server automatically if it isn't already running.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
```

A small helper so each test gets a fresh account (unique email per run is
passed in via `args`/env to keep tests deterministic — never `Date.now()`
inside committed fixtures):

```ts
// santa-app/e2e/helpers.ts
import { Page, expect } from '@playwright/test';

export async function register(page: Page, name: string, email: string) {
  await page.goto('/register');
  await page.getByLabel('Display name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Passw0rd!');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/rooms/);
}
```

The critical-path test — uses **two browser contexts** so the creator and a
joiner are genuinely separate sessions:

```ts
// santa-app/e2e/secret-santa.spec.ts
import { test, expect } from '@playwright/test';
import { register } from './helpers';

test('create → join → wishlist → draw → assignment', async ({ browser }) => {
  const stamp = test.info().testId; // stable per-test, not time-based
  const owner = await browser.newContext();
  const guest = await browser.newContext();
  const ownerPage = await owner.newPage();
  const guestPage = await guest.newPage();

  // 1) Two people register
  await register(ownerPage, 'Owner', `owner-${stamp}@test.dev`);
  await register(guestPage, 'Guest', `guest-${stamp}@test.dev`);

  // 2) Owner creates a room and grabs the invite code
  await ownerPage.getByRole('button', { name: /new room/i }).click();
  await ownerPage.getByLabel(/name/i).fill('E2E Room');
  await ownerPage.getByRole('button', { name: /create/i }).click();
  const code = (await ownerPage.getByTestId('invite-code').innerText()).trim();

  // 3) Guest joins with the code
  await guestPage.getByRole('button', { name: /join with code/i }).click();
  await guestPage.getByLabel(/invite code/i).fill(code);
  await guestPage.getByRole('button', { name: /join/i }).click();
  await expect(guestPage.getByText('E2E Room')).toBeVisible();

  // (a 3rd participant is needed for a valid draw — register + join once more,
  //  or seed via the API in a beforeEach; omitted here for brevity)

  // 4) Owner runs the draw
  await ownerPage.getByRole('button', { name: /draw names/i }).click();

  // 5) Each participant sees an assignment that is not themselves
  await expect(ownerPage.getByTestId('assignment-receiver')).toBeVisible();
  await expect(ownerPage.getByTestId('assignment-receiver')).not.toHaveText('Owner');

  await owner.close();
  await guest.close();
});
```

> **Test IDs.** Add `data-testid` to the few elements the E2E test queries
> (invite code, assignment receiver) — role/label selectors cover the rest.
> Keep the suite to the one or two journeys that must never break.

## Verification

Run each test suite independently:

```bash
# Make sure infrastructure is running
docker-compose up -d

# Run santa-api tests
cd santa-api && npm test
# Expected: all auth and room flow tests pass

# Run santa-notifications tests
cd santa-notifications && npm test
# Expected: notification CRUD and event flow tests pass

# Run santa-app tests
cd santa-app && npm test -- --run
# Expected: component tests pass with mocked API

# Run the full UI E2E (needs the whole stack up: docker compose + all 3 apps)
cd santa-app && npm run test:e2e
# Expected: "create → join → wishlist → draw → assignment" passes
```

Check test coverage:

```bash
cd santa-api && npm run test:cov
# Look for > 80% coverage on services and controllers

cd santa-app && npm run test:cov
# Look for key pages being tested
```

Verify cross-service flow:

```bash
cd santa-notifications && npx jest test/events.test.ts --verbose
# Should show: "should create notifications when draw.completed event is published" PASS
```

## Learn More

- [Testing NestJS Applications](https://docs.nestjs.com/fundamentals/testing)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Pact Contract Testing](https://pact.io/)
- [Testing Microservices (Martin Fowler)](https://martinfowler.com/articles/microservice-testing/)
- [Jest Configuration](https://jestjs.io/docs/configuration)
