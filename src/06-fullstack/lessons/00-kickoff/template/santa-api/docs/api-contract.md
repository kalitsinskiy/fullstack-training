# Secret Santa API Contract

Base URL: `http://localhost:3001/api`

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

## Auth

### `POST /auth/register`

Request:

```json
{
  "email": "alice@example.com",
  "password": "secret123",
  "displayName": "Alice"
}
```

Response `201`:

```json
{
  "id": "665f0c2ab7d13a5e8b1c4d9f",
  "email": "alice@example.com",
  "displayName": "Alice",
  "accessToken": "eyJ..."
}
```

Errors: `400`, `409`, `429`

### `POST /auth/login`

Request:

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "accessToken": "eyJ..."
}
```

Errors: `400`, `401`, `429`

## Users

### `GET /users/me`

Response `200`:

```json
{
  "id": "665f0c2ab7d13a5e8b1c4d9f",
  "displayName": "Alice",
  "email": "alice@example.com",
  "role": "user"
}
```

Errors: `401`

### `PATCH /users/me`

Request:

```json
{
  "displayName": "Alice Frost"
}
```

Response `200`: same shape as `GET /users/me`

Errors: `400`, `401`

## Rooms

**Room shape** (returned by every room endpoint below). Participants are populated
to `{ id, displayName }`; `participantCount` is the number of members.

```json
{
  "id": "665f0c2ab7d13a5e8b1c4d9f",
  "name": "New Year team building",
  "creatorId": "665f0c2ab7d13a5e8b1c4d1a",
  "inviteCode": "Q7X4LM",
  "participants": [
    { "id": "665f0c2ab7d13a5e8b1c4d1a", "displayName": "Mariia" }
  ],
  "participantCount": 1,
  "status": "pending",
  "drawDate": null
}
```

`status` is `"pending"` until the draw, then `"drawn"` (with `drawDate` set).

### `POST /rooms`

Request: `{ "name": "New Year team building" }`

Response `201`: the room shape (creator is the first participant).

Errors: `400`, `401`

### `GET /rooms?page=1&limit=10`

Response `200`: `{ "data": [ <room> ], "meta": { "total", "page", "limit", "totalPages" } }`
— rooms where the caller is a participant.

Notes:

- `page` defaults to `1`, clamped to a minimum of `1`
- `limit` defaults to `10`, minimum `1`, maximum `100`
- `totalPages` is always at least `1`, even when `data` is empty

Errors: `401`

### `GET /rooms/:id`

Response `200`: the room shape. Only a participant may read it.

Errors: `401`, `403`, `404`

### `POST /rooms/:id/join`

Request: `{ "inviteCode": "Q7X4LM" }`

Response `201`: the room shape (caller added to `participants`).

Errors: `400` (wrong invite code), `401`, `403` (draw already done), `404`

### `POST /rooms/:id/draw`

Creator-only. Requires at least 3 participants and a `pending` room. Produces a
derangement (no one is their own giftee) and saves all assignments in a single
atomic document write.

Response `200`: the room shape with `status: "drawn"` and `drawDate` set.

Errors: `400` (fewer than 3 participants / already drawn), `401`, `403` (not the creator), `404`

### `GET /rooms/:id/assignment`

Your giftee for a drawn room. Only a participant may read it.

Response `200`:

```json
{
  "receiver": {
    "id": "665f0c2ab7d13a5e8b1c4d2b",
    "displayName": "Gita",
    "wishlist": ["Wool socks", "A good book"]
  }
}
```

Errors: `400` (draw not done yet), `401`, `403`, `404`

## Wishlist

A wishlist is a list of plain strings, scoped to `{ roomId, userId }`.

### `PUT /rooms/:roomId/wishlist`

Upserts the caller's wishlist for the room.

Request: `{ "items": ["Wool socks", "A good book"] }`

Response `200`:

```json
{
  "roomId": "665f0c2ab7d13a5e8b1c4d9f",
  "userId": "665f0c2ab7d13a5e8b1c4d1a",
  "items": ["Wool socks", "A good book"]
}
```

Errors: `400`, `401`

### `GET /rooms/:roomId/wishlist/:userId`

Response `200`: the wishlist shape above. If the user has **no** wishlist yet,
returns an **empty** one (`"items": []`) — not a `404`.

Errors: `401`
