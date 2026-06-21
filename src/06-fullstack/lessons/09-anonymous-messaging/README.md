# Lesson 09: Anonymous Messaging

## Quick Overview

Secret Santa is more fun when participants can send anonymous hints to their assigned person. This feature is architecturally interesting: the sender must be verified (they can only message the person they were assigned), but the recipient must never learn who sent the message. santa-notifications acts as a mediator -- it verifies the sender's assignment via HTTP to santa-api, stores the message with the real senderId, but never exposes it to the recipient. Messages are pushed in real-time via Socket.IO.

> **Build the UI from the mockup.** Frontend lives on the **Messages** screen —
> Figma frames [mobile](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR/Secret-Santa-%E2%80%94-Mockups?node-id=34-2) ·
> [desktop](https://www.figma.com/design/vzwQuXGRqBQNUzpMlHtbvR/Secret-Santa-%E2%80%94-Mockups?node-id=44-2) (see [`santa-app/docs/mockups/`](../00-kickoff/template/santa-app/docs/mockups/)).
> Flesh out `santa-app/src/pages/MessagesPage.tsx` (two-tone chat bubbles,
> incoming left / outgoing right), following `docs/design-system.md`.

## Key Concepts

### Service as Mediator Pattern

In a direct communication model, the sender would call santa-api directly to send a message. But that leaks the sender's identity in the API response. Instead, we use santa-notifications as a **mediator**:

```
  Sender (santa-app)
    |
    | POST /messages { recipientId, roomId, text }
    |   (auth: sender's JWT)
    v
  santa-notifications (mediator)
    |
    | 1. Verify sender's assignment (HTTP call to santa-api)
    | 2. Store message (senderId saved internally, never returned)
    | 3. Push to recipient via Socket.IO
    | 4. Publish message.sent event to RabbitMQ
    |
    v
  Recipient (santa-app)
    sees: { text, roomId, createdAt }
    does NOT see: senderId
```

The mediator pattern decouples the sender from the recipient and gives us a single place to enforce privacy rules.

### Privacy by Design

Privacy by design means building privacy into the system architecture, not bolting it on as an afterthought.

**Rules for anonymous messaging:**
1. **Store senderId** -- you need it for auditing, moderation, and preventing abuse.
2. **Never return senderId** to the recipient -- strip it in the API response layer.
3. **Verify before storing** -- only allow a sender to message their assigned person.
4. **No metadata leaks** -- ensure timestamps, socket events, and error messages do not reveal the sender.

```typescript
// WRONG -- senderId leaks to recipient
return res.json(message);

// RIGHT -- explicitly exclude senderId
return res.json({
  id: message._id,
  roomId: message.roomId,
  text: message.text,
  createdAt: message.createdAt,
  // senderId is intentionally omitted
});
```

**Common mistakes that break anonymity:**
- Returning the full document from MongoDB (includes senderId)
- Including senderId in the Socket.IO push payload
- Error messages like "User X is not assigned to User Y"
- Sorting or filtering in a way that reveals send patterns

### Message Relay Flow

The complete flow for sending an anonymous message:

```
1. Sender clicks "Send" in santa-app
   -> POST http://localhost:3002/messages
      Headers: { Authorization: Bearer <sender-jwt> }
      Body: { recipientId: "bob123", roomId: "room456", text: "You'll love your gift!" }

2. santa-notifications receives the request
   -> Extracts sender's userId from JWT: "alice789"

3. santa-notifications calls santa-api to verify assignment
   -> GET http://localhost:3001/rooms/room456/assignment
      Headers: { Authorization: Bearer <sender-jwt> }
   -> Response: { assignedTo: "bob123" }

4. Verification: does event.assignedTo === recipientId?
   -> "bob123" === "bob123" ✓

5. Store message in MongoDB
   -> { senderId: "alice789", recipientId: "bob123", roomId: "room456",
        text: "You'll love your gift!", createdAt: now }

6. Push to recipient via Socket.IO (WITHOUT senderId)
   -> io.to("user:bob123").emit("message:received", {
        roomId: "room456", text: "You'll love your gift!", createdAt: now
      })

7. Publish event to RabbitMQ
   -> { type: "message.sent", roomId: "room456", recipientId: "bob123" }
```

### Data Modeling for Messages

```typescript
// The schema stores senderId -- but it is NEVER included in API responses to the recipient
interface IMessage {
  senderId: string;      // stored for auditing, never returned to recipient
  recipientId: string;   // the person receiving the message
  roomId: string;        // which Secret Santa room this belongs to
  text: string;          // the message content
  createdAt: Date;       // when it was sent
}
```

**Why store senderId at all?**
- Moderation: admins may need to investigate abuse.
- Rate limiting: prevent a sender from spamming.
- Deduplication: prevent the same message from being stored twice.
- Auditing: track what happened and when.

## Task

### Step 1: Create the Message Schema

```typescript
// santa-notifications/src/models/message.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: string;
  recipientId: string;
  roomId: string;
  text: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

// For listing messages received by a user in a room
MessageSchema.index({ recipientId: 1, roomId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
```

### Step 2: Implement POST /messages

Create the endpoint where authenticated users send anonymous messages.

```typescript
// santa-notifications/src/routes/messages.ts
import { FastifyInstance } from 'fastify';
import { Message } from '../models/message';
import { santaApiClient } from '../services/santa-api-client';

export async function messageRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/messages',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const senderId = request.user.sub;
      const { recipientId, roomId, text } = request.body as {
        recipientId: string;
        roomId: string;
        text: string;
      };

      // 1. Validate input
      if (!recipientId || !roomId || !text?.trim()) {
        return reply
          .status(400)
          .send({ message: 'recipientId, roomId, and text are required' });
      }

      if (text.length > 500) {
        return reply
          .status(400)
          .send({ message: 'Message must be 500 characters or less' });
      }

      // 2. Verify sender has an assignment in this room
      //    and that recipient matches the assigned person
      let assignment;
      try {
        assignment = await santaApiClient.getAssignment(
          roomId,
          request.headers.authorization!, // forward user's JWT
        );
      } catch {
        return reply
          .status(403)
          .send({ message: 'Unable to verify assignment' });
      }

      if (assignment.assignedTo !== recipientId) {
        // Generic error -- do NOT reveal who the sender is assigned to
        return reply
          .status(403)
          .send({ message: 'You can only message your assigned person' });
      }

      // 3. Store message
      const message = await Message.create({
        senderId,
        recipientId,
        roomId,
        text: text.trim(),
      });

      // 4. Push to recipient via Socket.IO (no senderId!)
      // NOTE: Socket.IO is created in server.ts *after* app.listen() (it attaches
      // to Fastify's HTTP server), but routes are registered during buildApp().
      // So `fastify.io` isn't available at registration time — read `io` lazily
      // through a tiny module-level registry (e.g. realtime.ts: setIO/getIO) that
      // server.ts populates once the socket server exists.
      const io = getIO(); // null-safe: io?.to(...) until the server is up
      io.to(`user:${recipientId}`).emit('message:received', {
        id: message._id,
        roomId: message.roomId,
        text: message.text,
        createdAt: message.createdAt,
      });

      // 5. Publish event to RabbitMQ
      await fastify.rabbitmq.publish('events', 'message.sent', {
        type: 'message.sent',
        roomId,
        recipientId,
      });

      // Return confirmation to sender (include their own message)
      return reply.status(201).send({
        id: message._id,
        recipientId: message.recipientId,
        roomId: message.roomId,
        text: message.text,
        createdAt: message.createdAt,
      });
    },
  );
}
```

> **Contract note.** The course's assignment endpoint returns
> `{ receiver: { id, displayName, wishlist } }` — there is no flat `assignedTo`
> field. Verify against `receiver.id`:
> `if (assignment.receiver.id !== recipientId) { /* 403 */ }`. The snippets here
> use `assignedTo` only to illustrate the idea.
>
> Also: `/rooms/:id/assignment` is **user-scoped** (it reads the caller's JWT),
> not a `/internal` route — forward the sender's `Authorization` header, not the
> service key. And the draw needs **at least 3 participants**, so set up three
> accounts when testing, not two.

Add the `getAssignment` method to `SantaApiClient`:

```typescript
// In santa-api-client.ts
async getAssignment(
  roomId: string,
  authHeader: string,
): Promise<{ assignedTo: string }> {
  return this.getWithAuth(`/rooms/${roomId}/assignment`, authHeader);
}

private async getWithAuth<T>(path: string, authHeader: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: authHeader },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`santa-api responded with ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Step 3: Implement GET /messages/:roomId

Return messages received by the current user in a specific room. **senderId must be excluded.**

```typescript
  fastify.get(
    '/messages/:roomId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { roomId } = request.params as { roomId: string };

      const messages = await Message.find(
        { recipientId: userId, roomId },
        { senderId: 0 }, // EXCLUDE senderId from results
      )
        .sort({ createdAt: 1 })
        .lean();

      return { data: messages };
    },
  );
```

**Critical**: the `{ senderId: 0 }` projection in the Mongoose query ensures senderId is never returned. This is the primary privacy safeguard.

### Step 4: Build the MessagesPage in santa-app

> **Build with the course stack, not MUI.** Use shadcn/ui + Tailwind, the `api`
> axios client, TanStack Query, `useSocket`, and `sonner` — like `LoginPage`/
> `RoomDetailPage` and the chat-bubble mockup above. The snippet below uses MUI
> **only to show structure** — port it to shadcn components + the design tokens;
> don't `npm install @mui/*`.
>
> Two course-stack specifics the snippet gets wrong: `useSocket()` returns the
> socket **directly** (`const socket = useSocket()`, not `const { socket } = …`),
> and the recipient id comes from `assignment.receiver.id` (see the contract note
> in Step 2). Messaging is also **per-room** — scope the page to a `roomId`
> (e.g. `/rooms/:id/messages`) rather than a single global Messages screen, since
> the santa-notifications client lives on `VITE_WS_URL` (:3002), not `VITE_API_URL`.

```tsx
// src/pages/MessagesPage.tsx
import { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Paper, CircularProgress, Alert,
} from '@mui/material';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';

interface Message {
  _id: string;
  roomId: string;
  text: string;
  createdAt: string;
}

export function MessagesPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  // Fetch received messages
  useEffect(() => {
    api
      .get<{ data: Message[] }>(`/messages/${roomId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [roomId]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: Message) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('message:received', handleMessage);
    return () => { socket.off('message:received', handleMessage); };
  }, [socket, roomId]);

  // Send a message to your assigned person
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    setError(null);

    try {
      // You need to know your assigned person's ID
      // This should come from the room detail / assignment endpoint
      const assignment = await api.get<{ assignedTo: string }>(
        `/rooms/${roomId}/assignment`,
      );

      await api.post('/messages', {
        recipientId: assignment.assignedTo,
        roomId,
        text: newMessage.trim(),
      });

      setNewMessage('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Anonymous Messages
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Received messages */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Messages from your Secret Santa
        </Typography>
        {messages.length === 0 ? (
          <Typography color="text.secondary">
            No messages yet. Your Secret Santa has not sent you anything.
          </Typography>
        ) : (
          messages.map((msg) => (
            <Paper key={msg._id} sx={{ p: 2, mb: 1 }}>
              <Typography>{msg.text}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(msg.createdAt).toLocaleString()}
              </Typography>
            </Paper>
          ))
        )}
      </Box>

      {/* Send message form */}
      <Box component="form" onSubmit={handleSend}>
        <Typography variant="h6" gutterBottom>
          Send a message to your assigned person
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write an anonymous hint..."
          disabled={sending}
          inputProps={{ maxLength: 500 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={sending || !newMessage.trim()}
          sx={{ mt: 1 }}
        >
          {sending ? 'Sending...' : 'Send Anonymous Message'}
        </Button>
      </Box>
    </Box>
  );
}
```

### Step 5: Add Navigation

In the room detail page, add a link to the messages page:

```tsx
// In RoomDetailPage, after the draw has happened
import { Link } from 'react-router-dom';

{room.isDrawn && (
  <Button
    component={Link}
    to={`/rooms/${room.id}/messages`}
    variant="outlined"
    sx={{ mt: 2 }}
  >
    Messages
  </Button>
)}
```

Add the route in your router configuration:

```tsx
<Route path="/rooms/:roomId/messages" element={<MessagesPage />} />
```

## Verification

Start all services:

```bash
docker-compose up -d
cd santa-api && npm run start:dev
cd santa-notifications && npm run start:dev
cd santa-app && npm run dev
```

Test the messaging API:

```bash
# Login as Alice (who is assigned to Bob)
ALICE_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@test.com","password":"password123"}' | jq -r '.accessToken')

# Send anonymous message from Alice to Bob
curl -s -X POST http://localhost:3002/messages \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"recipientId":"BOB_USER_ID","roomId":"ROOM_ID","text":"Hope you like puzzles!"}' | jq

# Login as Bob
BOB_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"bob@test.com","password":"password123"}' | jq -r '.accessToken')

# Bob reads messages -- should see the text but NOT the senderId
curl -s http://localhost:3002/messages/ROOM_ID \
  -H "Authorization: Bearer $BOB_TOKEN" | jq

# Verify: the response should NOT contain "senderId" or "alice"
```

Test privacy:

```bash
# Try to send to someone who is NOT your assigned person -- should get 403
curl -s -X POST http://localhost:3002/messages \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"recipientId":"CHARLIE_USER_ID","roomId":"ROOM_ID","text":"Wrong person"}' | jq
# Expected: { "message": "You can only message your assigned person" }
```

Test in the browser:
1. Open two browser tabs: Alice and Bob, both in the same room.
2. Navigate to the Messages page from the room detail.
3. Alice sends a message.
4. Bob should see the message appear in real-time (via Socket.IO) with no indication of who sent it.

## Learn More

- [Privacy by Design (Wikipedia)](https://en.wikipedia.org/wiki/Privacy_by_design)
- [Mediator Pattern](https://refactoring.guru/design-patterns/mediator)
- [Mongoose Projections](https://mongoosejs.com/docs/api/query.html#Query.prototype.select())
- [OWASP Data Privacy](https://owasp.org/www-project-top-ten/)
