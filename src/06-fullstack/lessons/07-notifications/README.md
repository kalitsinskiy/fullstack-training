# Lesson 07: Notifications

## Quick Overview

When microservices need to communicate, choosing between synchronous (HTTP) and asynchronous (message queue) patterns is a critical architecture decision. In this lesson we build the notifications feature end-to-end: santa-notifications consumes RabbitMQ events from the previous lesson, calls santa-api over HTTP to enrich data, stores notifications, and exposes them via REST. On the frontend, we add a notifications page and an unread-count badge in the header.

> **Build the UI from the mockup.** Frontend lives on the **Notifications**
> screen — Figma frames [mobile](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR/Secret-Santa-%E2%80%94-Mockups?node-id=36-2) ·
> [desktop](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR/Secret-Santa-%E2%80%94-Mockups?node-id=45-2) (see [`design/screens/`](../../../../design/screens/)).
> Flesh out `santa-app/src/pages/NotificationsPage.tsx`, following the
> `LoginPage` worked example and `design/design-system.md`.

## Key Concepts

### Sync vs Async Communication in Microservices

| | Synchronous (HTTP) | Asynchronous (Message Queue) |
|---|---|---|
| Coupling | Tight -- caller waits for a response | Loose -- producer does not know about consumers |
| Latency | Response needed immediately | Consumer processes when ready |
| Failure handling | If callee is down, caller fails | Messages survive; consumer retries later |
| Ordering | Request-response is inherently ordered | Must be handled explicitly (FIFO queues) |
| Use case | Need data right now (e.g., fetch user details) | Fire-and-forget events (e.g., draw completed) |

In the Secret Santa system, we use **both**:
- **Async**: santa-api publishes `draw.completed` to RabbitMQ; santa-notifications consumes it.
- **Sync**: santa-notifications calls santa-api via HTTP to fetch user/room details it needs to build a notification message.

### HTTP Client in Node.js

Three main options:

```typescript
// 1. Native fetch (Node 18+, built-in)
const res = await fetch('http://localhost:3001/users/abc', {
  headers: { Authorization: `Bearer ${token}` },
});
const user = await res.json();

// 2. undici -- high-performance HTTP client (ships with Node, powers native fetch)
import { request } from 'undici';
const { statusCode, body } = await request('http://localhost:3001/users/abc');
const user = await body.json();

// 3. axios -- popular third-party library
import axios from 'axios';
const { data: user } = await axios.get('http://localhost:3001/users/abc', {
  headers: { Authorization: `Bearer ${token}` },
});
```

We use **native fetch** in this course -- it requires no extra dependencies and is standard across Node.js and browsers.

### Circuit Breaker Pattern

When service B is down, service A should not keep hammering it with requests. The circuit breaker pattern prevents cascading failures:

```
  [CLOSED] ---- failure threshold reached ----> [OPEN]
     ^                                             |
     |                                      timeout expires
     |                                             |
     +--------- success --- [HALF-OPEN] <----------+
```

**States:**
- **Closed** (normal): requests flow through. Failures are counted. If failures exceed the threshold (e.g., 5 in 60 seconds), the circuit opens.
- **Open** (blocking): all requests fail immediately without calling the remote service. After a timeout (e.g., 30 seconds), the circuit transitions to half-open.
- **Half-Open** (probing): a single request is allowed through. If it succeeds, the circuit closes. If it fails, the circuit opens again.

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private threshold: number = 5,
    private resetTimeout: number = 30000,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit is OPEN — request blocked');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### Retry Logic with Exponential Backoff

Transient failures (network blip, temporary overload) often resolve on their own. Retry with increasing delays:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
      const jitter = delay * (0.5 + Math.random() * 0.5); // add randomness
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }

  throw new Error('Unreachable');
}
```

**Why jitter?** Without it, many clients retry at the exact same time (thundering herd), making the problem worse.

### HTTP Adapter Pattern

Abstract the HTTP client behind an interface so you can swap implementations and mock in tests:

```typescript
// http-adapter.ts
interface HttpAdapter {
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(url: string, body: unknown, options?: RequestOptions): Promise<T>;
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

// fetch-http-adapter.ts
class FetchHttpAdapter implements HttpAdapter {
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || 5000,
    );

    try {
      const res = await fetch(url, {
        headers: options.headers,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async post<T>(url: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}
```

In tests you can create a `MockHttpAdapter` that returns canned responses without hitting the network.

### Service-to-Service Authentication

When santa-notifications calls santa-api, it needs to authenticate. Common approaches:

1. **Shared secret / API key**: a secret token known to both services, sent in a header (`X-Service-Key`).
2. **Forward the user's JWT**: if the notification was triggered by a user action, pass their token along.
3. **Service account JWT**: santa-notifications has its own credentials and gets its own token.

For simplicity, we use a **shared service key** stored in environment variables:

```bash
# .env (both services)
SERVICE_API_KEY=super-secret-service-key-change-in-production
```

```typescript
// In santa-notifications, when calling santa-api
const res = await fetch(`${SANTA_API_URL}/users/${userId}`, {
  headers: { 'X-Service-Key': process.env.SERVICE_API_KEY },
});
```

```typescript
// In santa-api, a guard that accepts either JWT or service key
function verifyServiceKey(request: FastifyRequest) {
  const key = request.headers['x-service-key'];
  if (key === process.env.SERVICE_API_KEY) return true;
  throw new UnauthorizedException('Invalid service key');
}
```

## Task

### Step 1: Create the HTTP Adapter in santa-notifications

Create a service that calls santa-api with retry logic and timeout.

```typescript
// src/services/santa-api-client.ts

interface UserDetails {
  id: string;
  displayName: string;
  email: string;
}

interface RoomDetails {
  id: string;
  name: string;
  members: string[];
}

class SantaApiClient {
  private baseUrl: string;
  private serviceKey: string;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.baseUrl = process.env.SANTA_API_URL || 'http://localhost:3001';
    this.serviceKey = process.env.SERVICE_API_KEY || '';
    this.circuitBreaker = new CircuitBreaker(5, 30000);
  }

  async getUserById(userId: string): Promise<UserDetails> {
    return this.circuitBreaker.call(() =>
      withRetry(() => this.get(`/users/${userId}`)),
    );
  }

  async getRoomById(roomId: string): Promise<RoomDetails> {
    return this.circuitBreaker.call(() =>
      withRetry(() => this.get(`/rooms/${roomId}`)),
    );
  }

  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: { 'X-Service-Key': this.serviceKey },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`santa-api responded with ${res.status}`);
      return res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

Also add the environment variables:

```bash
# santa-notifications/.env
SANTA_API_URL=http://localhost:3001
SERVICE_API_KEY=super-secret-service-key-change-in-production
```

> ⚠️ You also need the **santa-api side** of these calls — they don't exist yet.
> santa-api has no `GET /users/:id` (only `/users/me`), and `GET /rooms/:id` is
> JWT- + membership-gated, so the notifications service (not a member) can't use
> them. Add a small `ServiceKeyGuard` (accepts the `X-Service-Key` header) and
> dedicated **internal endpoints** for the client to call, e.g.
> `GET /internal/users/:id` → `{ id, displayName, email }` and
> `GET /internal/rooms/:id` → `{ id, name, memberIds }`. Keeping them separate
> (rather than loosening the user-facing routes) avoids weakening real auth. The
> client should call those paths (mind the global `/api` prefix:
> `/api/internal/...`).

### Step 2: Create the Notification Schema

> ⚠️ You already have a Notification model from earlier lessons (a `message`
> field, an enum `type`, `roomId`, `messageId`). Don't create a second, divergent
> one — **reuse and extend** it. The `title`/`body` split below is illustrative;
> if your model uses a single `message`, keep that and just make sure it has
> `userId` (indexed) and `read`. Keep one model across L06/L07.
>
> Also note Step 3 adds `fastify.authenticate` to the notification routes — that's
> what finally closes the IDOR (read your OWN notifications, derived from the JWT,
> not a `?userId=` query). Wire that auth preHandler (verify the shared
> `JWT_SECRET` santa-api signs with) and scope every query to `request.user`.

```typescript
// src/models/notification.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'room.joined' | 'draw.completed' | 'wishlist.updated' | 'message.received';
  title: string;
  body: string;
  roomId?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    roomId: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound index for querying user's unread notifications efficiently
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema,
);
```

### Step 3: Implement GET /notifications

List notifications for the current user with pagination.

```typescript
// src/routes/notifications.ts
import { FastifyInstance } from 'fastify';
import { Notification } from '../models/notification';

export async function notificationRoutes(fastify: FastifyInstance) {
  // List notifications for current user
  fastify.get(
    '/notifications',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { page = 1, limit = 20 } = request.query as {
        page?: number;
        limit?: number;
      };

      const skip = (Number(page) - 1) * Number(limit);

      const [notifications, total] = await Promise.all([
        Notification.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Notification.countDocuments({ userId }),
      ]);

      const unreadCount = await Notification.countDocuments({
        userId,
        read: false,
      });

      return {
        data: notifications,
        total,
        unreadCount,
        page: Number(page),
        limit: Number(limit),
      };
    },
  );
}
```

### Step 4: Implement PATCH /notifications/:id/read

```typescript
  // Mark notification as read
  fastify.patch(
    '/notifications/:id/read',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId }, // ensure user owns this notification
        { read: true },
        { new: true },
      );

      if (!notification) {
        return reply.status(404).send({ message: 'Notification not found' });
      }

      return notification;
    },
  );
```

### Step 5: Wire RabbitMQ Events to Notifications

Update the RabbitMQ consumer from Lesson 06 to create notifications when events arrive.

```typescript
// src/consumers/event-consumer.ts
import { Notification } from '../models/notification';
import { santaApiClient } from '../services/santa-api-client';

interface DrawCompletedEvent {
  type: 'draw.completed';
  roomId: string;
  participants: string[];
}

interface RoomJoinedEvent {
  type: 'room.joined';
  roomId: string;
  userId: string;
}

async function handleDrawCompleted(event: DrawCompletedEvent) {
  const room = await santaApiClient.getRoomById(event.roomId);

  // Create a notification for each participant
  const notifications = event.participants.map((userId) => ({
    userId,
    type: 'draw.completed' as const,
    title: 'Secret Santa Draw Complete!',
    body: `The draw for "${room.name}" is done. Check who you got!`,
    roomId: event.roomId,
    read: false,
  }));

  await Notification.insertMany(notifications);
  return notifications;
}

async function handleRoomJoined(event: RoomJoinedEvent) {
  const [room, user] = await Promise.all([
    santaApiClient.getRoomById(event.roomId),
    santaApiClient.getUserById(event.userId),
  ]);

  // Notify all existing members (except the person who joined)
  const notifications = room.members
    .filter((memberId) => memberId !== event.userId)
    .map((memberId) => ({
      userId: memberId,
      type: 'room.joined' as const,
      title: 'New Member Joined',
      body: `${user.displayName} joined "${room.name}"`,
      roomId: event.roomId,
      read: false,
    }));

  await Notification.insertMany(notifications);
  return notifications;
}
```

### Step 6: Build the NotificationsPage in santa-app

> **Build with the course stack, not MUI.** Use shadcn/ui + Tailwind, the `api`
> axios client, TanStack Query (`useQuery`/`useMutation`), and `sonner` toasts —
> exactly like `LoginPage`/`RoomDetailPage` and the mockups in `design/design-system.md`.
> The snippets in Steps 6–7 use MUI **only to show structure and data flow** — port
> them to shadcn components + the design tokens; don't `npm install @mui/*`.

```tsx
// src/pages/NotificationsPage.tsx
import { useEffect, useState } from 'react';
import {
  List, ListItem, ListItemText, Typography, Chip,
  CircularProgress, Alert, Pagination, Box,
} from '@mui/material';
import { api } from '../services/api';

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  roomId?: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    api
      .get<{ data: Notification[]; total: number }>(
        `/notifications?page=${page}&limit=${limit}`,
      )
      .then((res) => {
        setNotifications(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const markAsRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
    );
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Notifications</Typography>
      <List>
        {notifications.map((n) => (
          <ListItem
            key={n._id}
            onClick={() => !n.read && markAsRead(n._id)}
            sx={{
              bgcolor: n.read ? 'transparent' : 'action.hover',
              cursor: n.read ? 'default' : 'pointer',
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemText
              primary={n.title}
              secondary={n.body}
              primaryTypographyProps={{
                fontWeight: n.read ? 'normal' : 'bold',
              }}
            />
            {!n.read && <Chip label="New" color="primary" size="small" />}
          </ListItem>
        ))}
      </List>
      <Pagination
        count={Math.ceil(total / limit)}
        page={page}
        onChange={(_, value) => setPage(value)}
      />
    </Box>
  );
}
```

### Step 7: Add Notification Bell in Layout Header

```tsx
// In your Layout component header
import { Badge, IconButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<{ unreadCount: number }>('/notifications?limit=1')
      .then((res) => setUnreadCount(res.unreadCount));
  }, []);

  return (
    <IconButton color="inherit" onClick={() => navigate('/notifications')}>
      <Badge badgeContent={unreadCount} color="error">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
}
```

Add `<NotificationBell />` to your AppBar and add a route for `/notifications` pointing to `NotificationsPage`.

## Verification

Start all services and infrastructure:

```bash
docker-compose up -d   # MongoDB, Redis, RabbitMQ
cd santa-api && npm run start:dev
cd santa-notifications && npm run start:dev
cd santa-app && npm run dev
```

Test the notifications API directly:

```bash
# Get JWT token (login)
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@test.com","password":"password123"}' | jq -r '.accessToken')

# List notifications (should be empty initially)
curl -s http://localhost:3002/notifications \
  -H "Authorization: Bearer $TOKEN" | jq

# Trigger a notification by joining a room (this publishes room.joined event)
curl -s -X POST http://localhost:3001/rooms/INVITE_CODE/join \
  -H "Authorization: Bearer $TOKEN"

# Check notifications again — should see "New Member Joined"
curl -s http://localhost:3002/notifications \
  -H "Authorization: Bearer $TOKEN" | jq

# Mark as read
curl -s -X PATCH http://localhost:3002/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer $TOKEN" | jq
```

Test in the browser:
1. Open http://localhost:5173 and log in.
2. The notification bell in the header should show the unread count.
3. Click the bell to navigate to the notifications page.
4. In another browser tab, join a room as a different user.
5. Refresh the first user's notifications page -- a "New Member Joined" notification should appear.

## Learn More

- [Circuit Breaker Pattern (Martin Fowler)](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Node.js native fetch](https://nodejs.org/docs/latest/api/globals.html#fetch)
- [Exponential Backoff and Jitter (AWS)](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [undici -- Node.js HTTP client](https://undici.nodejs.org/)
- [Microservices Communication Patterns](https://microservices.io/patterns/communication-style/)
