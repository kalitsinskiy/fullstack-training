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

## Endpoints

### `GET /api/notifications?userId=<objectId>`

Response `200`: `Notification[]`, newest first. Without `userId`, returns all
(intended for the owning user; filter by `userId` in practice).

### `GET /api/notifications/:id`

Response `200`: a single `Notification`.

Errors: `404`

### `POST /api/notifications`

Request:

```json
{
  "userId": "665f0c2ab7d13a5e8b1c4d1a",
  "type": "assignment",
  "message": "Your Secret Santa assignment is ready!",
  "payload": { "roomId": "665f0c2ab7d13a5e8b1c4d2b" }
}
```

Response `201`: the created `Notification`. Unknown body fields are rejected.

Errors: `400`

### `PATCH /api/notifications/:id/read`

Marks the notification read. Response `200`: the updated `Notification`.

Errors: `404`

### `DELETE /api/notifications/:id`

Response `204`: no body.

Errors: `404`

## Health

### `GET /health`

Response `200`: `{ "status": "ok" }`
