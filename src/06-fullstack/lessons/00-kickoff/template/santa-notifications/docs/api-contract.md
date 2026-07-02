# Secret Santa Notifications — API Contract

A **separate service** from santa-api (different process, different base URL).

Base URL: `http://localhost:3002`

- Notification endpoints are under the `/api/notifications` prefix.
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

- `type` is one of: `room_invite` | `assignment` | `wishlist_update` | `system`
- `message` is 1–500 characters
- `payload` is optional, free-form

## When notifications are created — and who sees them

santa-api publishes domain events to RabbitMQ; this service consumes them and
fans out **one notification per recipient**, then pushes each live over Socket.IO
to the recipient's `user:{id}` room (`notification` event → bell badge + toast).

| Event | Recipients | Excludes the actor? | Message |
|-------|-----------|---------------------|---------|
| `user.joined` | existing room members | **yes** — the person who joined | `"{name} joined \"{room}\""` |
| `draw.completed` | **all** participants | no — everyone should check their giftee | `"The draw for \"{room}\" is complete — check your giftee!"` |
| `wishlist.updated` | other participants | **yes** — the editor | `"A wishlist was updated in \"{room}\""` |
| `room.date_changed` | **all** participants | **yes** — the owner who changed it | `"The gift exchange for \"{room}\" is now {date}"` |
| `room.created` | — (none) | — | creator is the only member; the app's local toast is enough |

Rules:

- **Never self-notify on an action you just took.** The actor already gets local
  UI feedback (a toast), so exclude them from the fan-out (join, wishlist,
  date-change, create). `draw.completed` is the deliberate exception — the owner
  also wants the "check your giftee" nudge.
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

Response `200`: `{ "data": Notification[], "unreadCount": number }`

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

## Health

### `GET /health`

Response `200`: `{ "status": "ok" }`
