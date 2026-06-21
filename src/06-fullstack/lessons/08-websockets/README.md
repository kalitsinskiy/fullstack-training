# Lesson 08: WebSockets

## Quick Overview

HTTP is request-response: the client always initiates. WebSockets flip that model -- once connected, both client and server can send messages at any time. In this lesson we add Socket.IO to santa-notifications for real-time push, authenticate connections with JWT, use Socket.IO rooms to scope broadcasts, add a Redis adapter for horizontal scaling, and build a React hook to consume events on the frontend with toast notifications.

> **Frontend.** This lesson adds a `useSocket` hook plus toasts that surface on
> every screen (the **Rooms** and **Room detail** mockups show the live updates).
> The baseline already wires `sonner` (`<Toaster/>` in `App.tsx`) and ships
> `socket.io-client` + `VITE_WS_URL` — build on those, don't re-add them.

## Key Concepts

### WebSocket Protocol

WebSocket starts as an HTTP request (the "upgrade handshake") and then switches to a persistent, bidirectional TCP connection:

```
Client                              Server
  |                                    |
  |--- HTTP GET /socket (Upgrade) ---->|
  |<-- HTTP 101 Switching Protocols ---|
  |                                    |
  |<========= WebSocket =============>|
  |   (bidirectional, persistent)      |
  |                                    |
```

**vs HTTP polling:**

| | WebSocket | HTTP Polling | Long Polling |
|---|---|---|---|
| Connection | One persistent connection | New connection per poll | Held open until data or timeout |
| Latency | Instant (already connected) | Poll interval (e.g., 5s) | Lower than polling, still has reconnect overhead |
| Server push | Yes | No (client must ask) | Sort of (server responds when data is ready) |
| Overhead | Low after handshake | High (headers on every request) | Medium |
| Scaling | Stateful (requires sticky sessions or adapter) | Stateless (easy to scale) | Stateful |

### Why Socket.IO over Raw WebSockets

Raw WebSockets (`ws` library) give you a bare TCP-like connection. Socket.IO adds critical production features:

- **Automatic reconnection** with configurable backoff
- **Rooms and namespaces** for scoped broadcasting
- **Fallback transports** (long polling if WebSocket is blocked by proxy)
- **Acknowledgements** (callback when message is received)
- **Binary support** out of the box
- **Middleware** pipeline for auth and validation

```typescript
// Raw WebSocket -- you must handle everything manually
import { WebSocket } from 'ws';
const ws = new WebSocket('ws://localhost:3002');
ws.on('open', () => { /* ... */ });
ws.on('close', () => { /* reconnect logic? */ });
ws.on('error', () => { /* retry? */ });

// Socket.IO -- batteries included
import { io } from 'socket.io-client';
const socket = io('http://localhost:3002', {
  reconnection: true,          // auto-reconnect
  reconnectionDelay: 1000,     // start at 1s
  reconnectionDelayMax: 5000,  // cap at 5s
});
```

### Socket.IO Server in Fastify

Socket.IO can share the same HTTP server as Fastify:

```typescript
import Fastify from 'fastify';
import { Server } from 'socket.io';

const fastify = Fastify();
await fastify.listen({ port: 3002 });

// Attach Socket.IO to Fastify's underlying HTTP server
const io = new Server(fastify.server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});
```

**Important**: Fastify uses its own HTTP server under the hood. We pass `fastify.server` (the raw `http.Server`) to Socket.IO so both share the same port.

### JWT Authentication for WebSocket

Socket.IO supports middleware that runs during the handshake, before the `connection` event fires:

```typescript
import jwt from 'jsonwebtoken';

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = payload; // attach user info to socket
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

// Now in the connection handler, socket.data.user is available
io.on('connection', (socket) => {
  const userId = socket.data.user.sub;
  console.log(`User ${userId} connected via WebSocket`);
});
```

The client sends the token during connection:

```typescript
const socket = io('http://localhost:3002', {
  auth: {
    token: localStorage.getItem('token'),
  },
});
```

If the server middleware calls `next(new Error(...))`, the client receives a `connect_error` event and the connection is rejected.

### Socket.IO Rooms

Rooms are a server-side concept for grouping sockets. A socket can join multiple rooms. Broadcasting to a room sends the event to all sockets in that room except the sender.

```typescript
io.on('connection', (socket) => {
  const userId = socket.data.user.sub;

  // Join a room for each Secret Santa room the user belongs to
  socket.on('join-room', (roomId: string) => {
    socket.join(`room:${roomId}`);
    console.log(`User ${userId} joined room:${roomId}`);
  });

  // Leave a room
  socket.on('leave-room', (roomId: string) => {
    socket.leave(`room:${roomId}`);
  });
});

// Broadcasting to a room (from anywhere in the server)
function notifyRoom(roomId: string, event: string, data: unknown) {
  io.to(`room:${roomId}`).emit(event, data);
}

// Send to a specific user (by their userId, not socket ID)
function notifyUser(userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}
```

**Pattern**: also join a personal room `user:${userId}` on connection, so you can target individual users regardless of which Secret Santa rooms they are in.

```typescript
io.on('connection', (socket) => {
  const userId = socket.data.user.sub;
  socket.join(`user:${userId}`); // personal room for direct notifications
});
```

### Scaling with Redis Adapter

By default, Socket.IO rooms live in memory on a single server instance. If you run multiple instances (for load balancing), a socket connected to instance A cannot receive events from instance B.

The **Redis adapter** (`@socket.io/redis-adapter`) syncs room state and event broadcasting across instances via Redis Pub/Sub:

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

```
   Instance A                  Redis Pub/Sub                Instance B
  [Socket 1] ---- emit ----> [channel] ---- forward ----> [Socket 2]
  [Socket 3]                                               [Socket 4]
```

Now `io.to('room:abc').emit(...)` on instance A also reaches sockets connected to instance B that are in `room:abc`.

### Socket.IO Client in React

```typescript
// src/hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3002';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message === 'Invalid or expired token') {
        // Token is bad — don't keep retrying
        socket.disconnect();
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
```

## Task

### Step 1: Set Up Socket.IO Server in santa-notifications

Install dependencies:

```bash
cd santa-notifications
npm install socket.io @socket.io/redis-adapter
```

Create the Socket.IO server alongside Fastify:

```typescript
// src/socket.ts
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { Server as HttpServer } from 'http';

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    // implement JWT verification here
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.sub;

    // Join personal notification room
    socket.join(`user:${userId}`);

    // Handle joining Secret Santa rooms
    socket.on('join-room', (roomId: string) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}
```

Wire it into your Fastify startup:

```typescript
// src/app.ts (or wherever you start Fastify)
import { createSocketServer } from './socket';

const fastify = Fastify();
// ... register routes ...
await fastify.listen({ port: 3002 });

const io = createSocketServer(fastify.server);

// Export io so other modules (like RabbitMQ consumers) can use it
export { io };
```

### Step 2: Authenticate WebSocket Connections

Complete the auth middleware in `src/socket.ts`:

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication token required'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});
```

### Step 3: Auto-join User's Rooms on Connect

When a user connects, fetch their rooms from santa-api and join the corresponding Socket.IO rooms:

```typescript
io.on('connection', async (socket) => {
  const userId = socket.data.user.sub;
  socket.join(`user:${userId}`);

  // Fetch user's rooms from santa-api and auto-join
  try {
    const rooms = await santaApiClient.getUserRooms(userId);
    for (const room of rooms) {
      socket.join(`room:${room.id}`);
    }
  } catch (err) {
    console.error('Failed to fetch user rooms:', err);
  }
});
```

You will need to add a `getUserRooms` method to the `SantaApiClient` from Lesson 07, and a corresponding endpoint in santa-api (e.g., `GET /users/:id/rooms`).

### Step 4: Push Notifications via Socket.IO

When the RabbitMQ consumer creates a notification (from Lesson 07), also push it via Socket.IO:

```typescript
// In your event consumer
async function handleDrawCompleted(event: DrawCompletedEvent) {
  const notifications = await createDrawNotifications(event); // from Lesson 07

  // Push to each participant via Socket.IO
  for (const notification of notifications) {
    io.to(`user:${notification.userId}`).emit('notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      roomId: notification.roomId,
      createdAt: notification.createdAt,
    });
  }
}
```

### Step 5: Add Redis Adapter

```typescript
// src/socket.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export async function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, { /* cors config */ });

  // Redis adapter for horizontal scaling
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  // ... auth middleware, connection handler ...

  return io;
}
```

### Step 6: Create useSocket Hook in santa-app

Install the client library:

```bash
cd santa-app
npm install socket.io-client
```

Create the custom hook:

```typescript
// src/hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3002';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join-room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave-room', roomId);
  }, []);

  return { socket: socketRef.current, isConnected, joinRoom, leaveRoom };
}
```

Add `VITE_WS_URL=http://localhost:3002` to santa-app's `.env`.

### Step 7: Add Toast Notifications

> **Use the course stack.** `sonner` is **already wired** — `<Toaster />` lives in
> `App.tsx`. Do **not** install `react-hot-toast` or MUI Snackbar, and don't add a
> second `<Toaster />`. Just call `sonner`'s `toast()`.

Create a component that listens for Socket.IO events and shows toasts via `sonner`:

```tsx
// src/components/SocketNotifications.tsx
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';

interface NotificationPayload {
  id: string;
  type: string;
  message: string;
}

export function SocketNotifications() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: NotificationPayload) => {
      toast(payload.message, { icon: iconFor(payload.type) });
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  return null; // the global <Toaster /> already lives in App.tsx
}

function iconFor(type: string): string {
  switch (type) {
    case 'draw.completed': return '🎉';
    case 'room.joined': return '👋';
    case 'message.received': return '💬';
    default: return '🔔';
  }
}
```

Mount `<SocketNotifications />` once in your root layout so it listens globally.

### Step 8: Real-Time Room Updates

When someone joins a room or a draw happens, broadcast to the room so other participants see it instantly:

```typescript
// In santa-notifications event consumer
async function handleRoomJoined(event: RoomJoinedEvent) {
  const notifications = await createJoinNotifications(event);

  // Also broadcast a room-level event so the RoomDetailPage can update
  io.to(`room:${event.roomId}`).emit('room:member-joined', {
    roomId: event.roomId,
    userId: event.userId,
  });

  // Push individual notifications
  for (const notification of notifications) {
    io.to(`user:${notification.userId}`).emit('notification', notification);
  }
}
```

On the frontend, listen for room events in the RoomDetailPage:

```tsx
// In RoomDetailPage
const { socket, joinRoom, leaveRoom } = useSocket();

useEffect(() => {
  if (!socket || !roomId) return;
  joinRoom(roomId);

  socket.on('room:member-joined', (data) => {
    // Refetch room details to get the updated member list
    fetchRoom();
  });

  socket.on('room:draw-completed', () => {
    fetchRoom();
  });

  return () => {
    leaveRoom(roomId);
    socket.off('room:member-joined');
    socket.off('room:draw-completed');
  };
}, [socket, roomId]);
```

## Gotchas found in practice

- **One shared socket, not one per component.** `useSocket()` as written opens a
  NEW connection every time it's called — mount it in two components and you get
  two WebSockets per user (double presence, double events). Provide a single
  socket via a React context/provider and consume that everywhere
  (`SocketNotifications`, `RoomDetailPage`, …).
- **Presence is multi-connection.** A naive `SADD online:users` / `SREM` on
  connect/disconnect goes wrong when a user has two tabs (one closing removes them
  while the other is still open) or on an unclean disconnect (stale entries
  linger). Track a per-user socket-id set (or a ref count) and only mark offline
  when the last one drops.
- **Redis adapter works with your existing ioredis.** No need to add `redis`
  (node-redis) — `createAdapter(pub, sub)` accepts ioredis clients (`new Redis(url)`
  + `.duplicate()`), which you already use for caching/presence.
- **Room-level live updates don't need `getUserRooms`.** Instead of auto-joining
  every room on connect (Step 3, which needs a `getUserRooms` endpoint), have the
  **RoomDetailPage emit `join-room` when it opens** (and `leave-room` on unmount),
  then broadcast `room:member-joined` / `room:draw-completed` from the consumer and
  refetch on receipt. You only need `getUserRooms` if you want room events while
  the user is NOT on that room's page.

## Verification

Test WebSocket connection:

```bash
# Start all services
docker-compose up -d
cd santa-api && npm run start:dev
cd santa-notifications && npm run start:dev
cd santa-app && npm run dev
```

Test with a quick Node.js script:

```typescript
// test-socket.mjs
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  auth: { token: 'YOUR_JWT_TOKEN_HERE' },
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('join-room', 'ROOM_ID_HERE');
});

socket.on('notification', (data) => {
  console.log('Notification received:', data);
});

socket.on('connect_error', (err) => {
  console.error('Connection failed:', err.message);
});
```

Test in the browser:
1. Open http://localhost:5173 in two browser tabs, logged in as different users who are both in the same room.
2. In tab A, trigger a draw or have another user join the room.
3. Tab B should immediately see a toast notification and the room detail page should update without a manual refresh.
4. Check the browser DevTools Network tab (WS filter) to see the WebSocket frames.

Test authentication rejection:

```bash
# Connect with an invalid token -- should get "Invalid or expired token"
node -e "
  const { io } = require('socket.io-client');
  const s = io('http://localhost:3002', { auth: { token: 'bad-token' } });
  s.on('connect_error', (e) => { console.log('Rejected:', e.message); process.exit(); });
"
```

## Learn More

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO with Fastify](https://socket.io/docs/v4/server-initialization/#with-fastify)
- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [WebSocket Protocol (RFC 6455)](https://www.rfc-editor.org/rfc/rfc6455)
- [Socket.IO React Integration](https://socket.io/how-to/use-with-react)
