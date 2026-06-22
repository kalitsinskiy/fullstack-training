# Lesson 09: Anonymous Messaging

## Quick Overview

Secret Santa is more fun when participants can chat with the people they're
matched with. Each participant has **two** relationships in a room: the **giftee**
they drew (they're allowed to know who it is) and their own **Secret Santa** (who
must stay anonymous). So the Messages screen is **two separate, named chats**, and
each chat is **two-way**. The architecturally interesting part: the recipient is
never addressed by a raw id from the client — santa-notifications acts as a
mediator that resolves the recipient from the assignment graph, stores the message
with the real `senderId`, but never exposes the Secret Santa's identity. Messages
are pushed in real-time via Socket.IO.

> **Build the UI from the mockup.** Frontend lives on the **Messages** screen —
> see the local mockups in [`design/screens/`](../00-kickoff/template/santa-app/design/screens/).
> Flesh out the room messages page (two-tone chat bubbles, your own messages
> right / the other party's left) with a **switcher between the two chats**
> ("your giftee" / "your Secret Santa"), following `santa-app/design/design-system.md`.

## Key Concepts

### Two threads per person, not one

Each participant has **two distinct relationships** in a room, and they should be
two **separate, named chats** — merging them into one timeline is confusing
(you'd see your outgoing hints to your giftee interleaved with incoming hints
from a *different* person, your Santa):

- **Your giftee** — the person you drew. You're *allowed* to know who it is, so
  name the chat after them ("Bob"). You can message them; they can reply.
- **Your Secret Santa** — whoever drew you. You must **never** learn who it is,
  so the chat is named generically ("Your Secret Santa"). They message you; you
  can reply anonymously.

The same A→B conversation therefore appears under **different names depending on
who's looking**: in the Santa's list it's titled with the giftee's name; in the
giftee's list it's "Your Secret Santa". Replying to your Santa is the interesting
case — you don't know their id, so the **server resolves the recipient** from the
assignment graph (a service-key `/internal` lookup that returns
`{ gifteeId, santaId }` for a user). The `santaId` is used only for routing and
is never sent to the giftee's client. The send endpoint takes
`{ roomId, to: 'giftee' | 'santa', text }` rather than a raw `recipientId`, so a
client can never address an arbitrary user — only its own two relationships.

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
3. **Resolve, don't trust** -- the client sends `to: 'giftee' | 'santa'`, never a
   raw recipient id. The server resolves the recipient from the assignment graph,
   so a client can only ever reach its own two relationships.
4. **No metadata leaks** -- ensure timestamps, socket events, and error messages do
   not reveal the sender, and never return the Secret Santa's id or name.

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

The client never names a recipient by id — it says **which relationship** it's
messaging (`to: 'giftee' | 'santa'`) and the server resolves the actual user:

```
1. Sender clicks "Send" in santa-app (in the "your Secret Santa" chat)
   -> POST http://localhost:3002/api/messages
      Headers: { Authorization: Bearer <sender-jwt> }
      Body: { roomId: "room456", to: "santa", text: "thanks!" }

2. santa-notifications receives the request
   -> Extracts sender's userId from JWT: "bob123"

3. santa-notifications asks santa-api for bob's relationships (service key)
   -> GET http://localhost:3001/api/internal/rooms/room456/relations/bob123
   -> Response: { gifteeId: "charlie", santaId: "alice789" }

4. Resolve recipient from `to`: to=="santa" -> recipientId = santaId = "alice789"
   (to=="giftee" would pick gifteeId; null -> 403, the draw isn't done)

5. Store message in MongoDB
   -> { senderId: "bob123", recipientId: "alice789", roomId: "room456",
        text: "thanks!", createdAt: now }

6. Push to recipient via Socket.IO (WITHOUT senderId)
   -> the message is the mirror relationship for the recipient: bob is alice's
      giftee, so it lands in alice's "giftee" chat
   -> io.to("user:alice789").emit("message:received", {
        id, roomId: "room456", text: "thanks!", createdAt: now,
        direction: "in", thread: "giftee"   // never senderId
      })
```

`thread` tells the recipient which of their two chats the message belongs to, and
is the **mirror** of the sender's side: messaging your *giftee* arrives in their
*santa* chat, and messaging your *santa* arrives in their *giftee* chat.

### Data Modeling for Messages

```typescript
// The schema stores senderId -- but it is NEVER included in API responses to the recipient
interface IMessage {
  senderId: string;      // stored for auditing, never returned to a client
  recipientId: string;   // server-resolved from the assignment graph (giftee/santa)
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

// A thread is two-way, so index both sides of a (user, room) conversation.
MessageSchema.index({ recipientId: 1, roomId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, roomId: 1, createdAt: -1 });

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

> **⚠️ Build the two-relationship version, not the snippet above.** The snippet
> takes a raw `recipientId` and only lets you message your giftee. The real
> contract is:
>
> - **Body:** `{ roomId, to: 'giftee' | 'santa', text }` — no `recipientId`.
> - **Resolve the recipient server-side** from the assignment graph. Add a
>   service-key `/internal` endpoint on santa-api that returns both relationships
>   for a user:
>   `GET /api/internal/rooms/:roomId/relations/:userId → { gifteeId, santaId }`
>   (return `null`s when the room isn't drawn). `recipientId = to === 'giftee' ?
>   gifteeId : santaId`; a `null` recipient → **403** with a generic message.
> - **Compute the recipient's thread** as the mirror of `to`
>   (`to === 'giftee' ? 'santa' : 'giftee'`) and include it in the socket payload
>   as `thread`, alongside `direction: 'in'` — but **never** `senderId`.
> - **Return** the sender's own message with `direction: 'out'` and `thread: to`.
>
> Resolving the recipient on the server (rather than trusting a client-supplied
> id) is what lets someone reply to their Secret Santa without ever learning who
> it is — the `santaId` is used only for routing and never sent to the client.

Add the relations lookup to `SantaApiClient` (service key, internal route):

```typescript
// In santa-api-client.ts
getRelations(
  roomId: string,
  userId: string,
): Promise<{ gifteeId: string | null; santaId: string | null }> {
  // X-Service-Key, wrapped in the same retry + circuit-breaker as the others.
  return this.get(`/api/internal/rooms/${roomId}/relations/${userId}`);
}
```

### Step 3: Implement GET /messages/:roomId — both threads

Return the caller's **two conversations** for the room. Resolve the caller's
`{ gifteeId, santaId }` (the same relations lookup), then for each relationship
fetch the messages exchanged **in both directions** with that person:

```typescript
  // conversation between the caller (me) and one other party
  const docs = await Message.find({
    roomId,
    $or: [
      { senderId: me, recipientId: other },
      { senderId: other, recipientId: me },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  // map to { id, roomId, text, createdAt, direction } —
  // direction = senderId === me ? 'out' : 'in'. NEVER include senderId.
```

Shape the response so the two chats are clearly separated:

```jsonc
{
  // named — the caller is allowed to know their giftee
  "giftee": { "id": "...", "name": "Bob", "messages": [ /* {id,text,createdAt,direction} */ ] },
  // anonymous — NO id, NO name, ever
  "santa":  { "messages": [ /* ... */ ] }
}
```

Each side is `null` until the draw is done. **Critical**: never put `senderId`
in any message object, and never put the Secret Santa's `id`/`name` in the
`santa` block — `direction` is all the client needs to place a bubble left/right.

### Step 4: Build the MessagesPage in santa-app

> **Build with the course stack, not MUI.** Use shadcn/ui + Tailwind, the `api`
> axios client, TanStack Query, `useSocket`, and `sonner` — like `LoginPage`/
> `RoomDetailPage` and the chat-bubble mockup above. The snippet below uses MUI
> **only to show structure** — port it to shadcn components + the design tokens;
> don't `npm install @mui/*`.
>
> The snippet is a **single** received-only list — build the **two-chat** version
> instead: a switcher between "your giftee" (labelled with their name) and "your
> Secret Santa" (anonymous), each a two-way bubble thread (your messages right,
> the other party's left). Send with `{ roomId, to, text }` where `to` is the
> active chat; on an incoming socket message, route it by its `thread` field into
> the matching list.
>
> Course-stack specifics the snippet gets wrong: `useSocket()` returns the socket
> **directly** (`const socket = useSocket()`, not `const { socket } = …`).
> Messaging is **per-room** — scope the page to a `roomId` (e.g.
> `/rooms/:id/messages`), and the santa-notifications client lives on
> `VITE_WS_URL` (:3002), not `VITE_API_URL`.
>
> **Notify the recipient anywhere.** Also listen for `message:received` in a
> **global** component (the one mounted in the app shell, beside the notifications
> listener) and pop a `sonner` toast — otherwise a recipient who isn't on the chat
> page never learns a message arrived. The open thread still appends it; the global
> listener just adds the toast.

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

Set up a room with **at least 3 participants** and run the draw (the draw needs
3+). Suppose the cycle is Alice → Bob → Charlie → Alice, so Alice's giftee is Bob
and Alice's Secret Santa is Charlie.

```bash
ALICE=$(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"alice@test.com","password":"password123"}' | jq -r '.accessToken')

# Alice messages her giftee, then her (anonymous) Secret Santa — no recipient id.
curl -s -X POST http://localhost:3002/api/messages -H "Authorization: Bearer $ALICE" \
  -H 'Content-Type: application/json' \
  -d '{"roomId":"ROOM_ID","to":"giftee","text":"hope you like puzzles!"}' | jq
curl -s -X POST http://localhost:3002/api/messages -H "Authorization: Bearer $ALICE" \
  -H 'Content-Type: application/json' \
  -d '{"roomId":"ROOM_ID","to":"santa","text":"thanks, santa!"}' | jq

# Bob reads his two threads. His "santa" thread holds Alice's hint — with the
# text but NO senderId, and the santa block has NO id/name.
BOB=$(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"bob@test.com","password":"password123"}' | jq -r '.accessToken')
curl -s http://localhost:3002/api/messages/ROOM_ID -H "Authorization: Bearer $BOB" | jq
# Verify: no "senderId" anywhere, and santa = { messages: [...] } (no id/name).

# Bidirectional: Bob replies to HIS santa (= Alice). It lands in Alice's giftee chat.
curl -s -X POST http://localhost:3002/api/messages -H "Authorization: Bearer $BOB" \
  -H 'Content-Type: application/json' \
  -d '{"roomId":"ROOM_ID","to":"santa","text":"thank you, mystery santa!"}' | jq
```

Privacy / anonymity checks:

- A `to` of `giftee`/`santa` with no assignment yet (room not drawn) → **403**
  with a generic message (never "you aren't assigned to X").
- The `santa` block and every `message:received` payload contain **no** `senderId`
  and **no** Secret Santa id/name.
- A client cannot message an arbitrary user — there's no `recipientId` to set.

Test in the browser:
1. Open two tabs: Alice and Bob, in the same drawn room, on the room's Messages page.
2. Alice's "Bob" chat and Bob's "Your Secret Santa" chat are the **same conversation
   under different names**.
3. Alice sends in her "Bob" chat → Bob sees it instantly in "Your Secret Santa"
   (left bubble, no sender shown). Bob replies there → Alice sees it instantly in
   her "Bob" chat (left bubble).

## Learn More

- [Privacy by Design (Wikipedia)](https://en.wikipedia.org/wiki/Privacy_by_design)
- [Mediator Pattern](https://refactoring.guru/design-patterns/mediator)
- [Mongoose Projections](https://mongoosejs.com/docs/api/query.html#Query.prototype.select())
- [OWASP Data Privacy](https://owasp.org/www-project-top-ten/)
