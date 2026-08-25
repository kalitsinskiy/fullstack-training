# Secret Santa Notifications — API Contract

A **separate service** from santa-api (different process, different base URL).

Base URL: `http://localhost:3002`

- Notification endpoints are under the `/api/notifications` prefix.
- Anonymous messaging is under the `/api/messages` prefix.
- `GET /health` is at the root (no `/api` prefix).

> This service is built up over Lessons 06–08 (notifications, WebSocket push,
> anonymous messaging). The endpoints below are the baseline notification CRUD;
> later lessons add a RabbitMQ consumer and a Socket.IO gateway on top.

## Notification shape

```json
{
  "id": "665f0c2ab7d13a5e8b1c4d9f",
  "userId": "665f0c2ab7d13a5e8b1c4d1a",
  "type": "assignment",
  "message": "Your Secret Santa assignment is ready!",
  "payload": { "roomId": "665f0c2ab7d13a5e8b1c4d2b" },
  "read": false,
  "createdAt": "2025-12-20T10:00:00.000Z"
}
```

- `type` is one of the per-user types `room_invite` | `assignment` |
  `wishlist_update` | `system`, **or** a RabbitMQ routing key (Lesson 06):
  `room.created` | `user.joined` | `draw.completed` | `wishlist.updated`
- `message` is 1–500 characters
- `payload` is optional, free-form
- `userId` is **nullable**: notifications created from consumed events are
  room-scoped and have no single recipient yet (Lesson 07 fans each event out to
  one notification per participant, which fills it in). Such notifications carry
  `roomId` and a `messageId` (the RabbitMQ message id, unique — this is what makes
  redelivery idempotent).
- `POST /api/notifications` still accepts only the four per-user types; the events
  consumer writes through the model directly, not over HTTP.

## When notifications are created — and who sees them

santa-api publishes domain events to RabbitMQ; this service consumes them and
fans out **one notification per recipient**, then pushes each live over Socket.IO
to the recipient's `user:{id}` room (`notification` event → bell badge + toast).

| Event               | Recipients            | Excludes the actor?                     | Message                                                      |
| ------------------- | --------------------- | --------------------------------------- | ------------------------------------------------------------ |
| `user.joined`       | existing room members | **yes** — the person who joined         | `"{name} joined \"{room}\""`                                 |
| `draw.completed`    | **all** participants  | no — everyone should check their giftee | `"The draw for \"{room}\" is complete — check your giftee!"` |
| `wishlist.updated`  | other participants    | **yes** — the editor                    | `"A wishlist was updated in \"{room}\""`                     |
| `room.created`      | room members (= the creator) | no                               | `"Room \"{room}\" was created"`                              |
| `room.date_changed` | **all** participants  | **yes** — the owner who changed it      | `"The gift exchange for \"{room}\" is now {date}"` — **not implemented yet**; santa-api does not publish this event |

Rules:

- **Never self-notify on an action you just took.** The actor already gets local
  UI feedback (a toast), so exclude them from the fan-out (join, wishlist,
  date-change). `draw.completed` is the deliberate exception — the owner also
  wants the "check your giftee" nudge.
- **Anonymous messages are not stored as notifications.** The recipient gets a
  live `message:received` socket push (Lesson 09) → the client shows a toast
  globally (not only on the open chat). The sender's identity is never included.
- **A user only ever sees their own notifications** — every read/list/delete is
  authenticated and scoped to the caller (see below).

## Endpoints

All endpoints require the caller's **JWT** (same `JWT_SECRET` santa-api signs
with), except `POST` which is service-to-service. Scope every read to the caller —
never trust a `userId` from the client.

### `GET /api/notifications`

The **caller's own** notifications (derived from the JWT, not a query param),
newest first, plus an unread count for the bell badge.

Query: `page` (default 1), `limit` (default 20, max 100), `unreadOnly` (default false).

Response `200`: `{ "data": Notification[], "unreadCount": number }` — `unreadCount`
is the caller's total unread, not the count on this page.

Errors: `401`

### `GET /api/notifications/:id`

The caller's own notification. Returns `404` for someone else's id (no leaking).

Errors: `401`, `404`

### `POST /api/notifications`

**Service-to-service only** — used by the event consumer, not the browser.
Requires the shared `X-Service-Key` header (a client can't forge a notification
for another user).

Request: `{ "userId", "type", "message", "payload?" }`. Response `201`: the created
`Notification`. Unknown body fields are rejected.

Errors: `400`, `401` (missing/invalid service key)

### `PATCH /api/notifications/:id/read`

Marks the caller's own notification read. Response `200`: the updated `Notification`.

Errors: `401`, `404`

### `DELETE /api/notifications/:id`

Deletes the caller's own notification. Response `204`: no body.

Errors: `401`, `404`

## Anonymous messaging

Each participant of a drawn room has **two** relationships, so the Messages
screen is **two separate, named chats**, each two-way:

| Thread   | Titled                | Who the other party is                            |
| -------- | --------------------- | ------------------------------------------------- |
| `giftee` | the giftee's name     | the person the caller drew — knowing them is fine |
| `santa`  | "Your Secret Santa"   | whoever drew the caller — **never** identified    |

The same A→B conversation appears in A's `giftee` thread and B's `santa` thread —
one stored conversation, two views of it.

### Message shape (the only client-facing form)

```json
{
  "id": "665f0c2ab7d13a5e8b1c4d7e",
  "roomId": "665f0c2ab7d13a5e8b1c4d2b",
  "text": "hope you like puzzles!",
  "createdAt": "2025-12-20T10:00:00.000Z",
  "direction": "out"
}
```

`direction` is `"out"` when the caller sent it (right bubble) and `"in"` when they
received it (left bubble) — which is all a client needs, so `senderId` never has
to be returned. It **is** stored, for moderation, rate limiting and auditing.

### `POST /api/messages`

Sends a message to one of the caller's two relationships. Requires the caller's JWT.

Request:

```json
{ "roomId": "665f0c2ab7d13a5e8b1c4d2b", "to": "santa", "text": "thanks, santa!" }
```

- `to` is `"giftee" | "santa"`. **There is no `recipientId`** — the service resolves
  the recipient from santa-api's assignment graph
  (`GET /api/internal/rooms/:roomId/relations/:userId`), so a client can only ever
  reach its own two chats. A smuggled `recipientId` is stripped and ignored.
- `text` is 1–500 characters and must contain a non-whitespace character; it is
  stored trimmed.

Response `201`: the message shape above with `"direction": "out"` and `"thread"`
echoing the `to` you sent.

Side effects:

1. The recipient is pushed a `message:received` socket event (below).
2. A `message.sent` event `{ type, roomId, recipientId }` is published to the
   `santa.events` exchange for moderation/analytics. Nothing consumes it yet, and
   a broker outage never fails the request.

Errors: `400` (validation), `401`, `403` — a single generic
`"You cannot send a message in this room yet"` covering *not drawn yet*, *not a
participant* and *santa-api unreachable* alike. A more specific message would let
a sender probe the assignment graph.

### `GET /api/messages/:roomId`

The caller's **two** conversations for the room, each in full (both directions),
oldest first.

```jsonc
{
  // named — the caller is allowed to know their giftee
  "giftee": { "id": "665f…", "name": "Bob", "messages": [ /* … */ ] },
  // anonymous — no id, no name, ever
  "santa": { "messages": [ /* … */ ] }
}
```

Each side is `null` until the draw is done (reading is not a refusal — the page
renders that state). The giftee's name comes from an internal user lookup and
falls back to `"Your giftee"` if santa-api is unreachable, so the thread stays
readable.

Errors: `400` (malformed room id), `401`

### Socket event `message:received`

Pushed to the recipient's `user:{id}` room:

```json
{
  "id": "665f0c2ab7d13a5e8b1c4d7e",
  "roomId": "665f0c2ab7d13a5e8b1c4d2b",
  "text": "thanks, santa!",
  "createdAt": "2025-12-20T10:00:00.000Z",
  "direction": "in",
  "thread": "giftee"
}
```

`thread` is the **mirror** of the sender's `to`: messaging your *giftee* arrives in
their *santa* thread, and messaging your *santa* arrives in their *giftee* thread.
The payload carries **no** `senderId` and never the Secret Santa's id or name.

### `GET /users/online`

Response `200`: `string[]` — the ids of currently connected users.

### `GET /users/online/count`

Response `200`: `{ "count": number }`

## Health

### `GET /health`

Response `200`: `{ "status": "ok" }`
