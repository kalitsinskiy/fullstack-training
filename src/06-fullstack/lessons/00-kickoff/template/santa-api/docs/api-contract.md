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

## Roles & Permissions

Access to room features is decided **by permission, never by role**. Each
participant has a room-scoped role (`owner` or `member`); a role is just a named
preset of permissions:

| Permission | `owner` | `member` |
|------------|:------:|:--------:|
| `room:view` | ✅ | ✅ |
| `wishlist:set` | ✅ | ✅ |
| `room:draw` | ✅ | — |
| `room:invite` | ✅ | — |
| `room:kick` | ✅ | — |
| `room:edit` | ✅ | — |
| `room:delete` | ✅ | — |

The room creator is the `owner`; everyone who joins is a `member`. Every room
object includes `viewerPermissions` — the calling user's effective permissions
for that room, which the frontend uses to gate UI. A request lacking the required
permission gets `403`; a non-member gets `404`.

> Adding a new role is a one-line change to the role→permission preset on the
> backend — no guard, route, or frontend change.

## Rooms

**Room shape** (returned by every room endpoint below). Participants are populated
to `{ id, displayName, role }`; `participantCount` is the number of members;
`viewerPermissions` is the caller's permissions for this room.

```json
{
  "id": "665f0c2ab7d13a5e8b1c4d9f",
  "name": "New Year team building",
  "creatorId": "665f0c2ab7d13a5e8b1c4d1a",
  "inviteCode": "Q7X4LM",
  "participants": [
    { "id": "665f0c2ab7d13a5e8b1c4d1a", "displayName": "Mariia", "role": "owner" }
  ],
  "participantCount": 1,
  "status": "pending",
  "drawDate": null,
  "viewerPermissions": ["room:view", "room:draw", "room:invite", "room:kick", "room:edit", "room:delete", "wishlist:set"]
}
```

`status` is `"pending"` until the draw, then `"drawn"` (with `drawDate` set).

### `POST /rooms`

Request: `{ "name": "New Year team building" }`

Response `201`: the room shape (creator is the first participant, with role `owner`).

Errors: `400`, `401`

> Stretch (Kickoff §4): if you enforce unique room names per creator, the same
> creator reusing a name returns `409`. Names are NOT globally unique — different
> users may reuse a name.

### `GET /rooms?page=1&limit=10`

Response `200`: `{ "data": [ <room> ], "meta": { "total", "page", "limit", "totalPages" } }`
— rooms where the caller is a participant.

Notes:

- `page` defaults to `1`, clamped to a minimum of `1`
- `limit` defaults to `10`, minimum `1`, maximum `100`
- `totalPages` is always at least `1`, even when `data` is empty

Errors: `401`

### `GET /rooms/:id`

Requires `room:view`. Response `200`: the room shape. Only a participant may read
it; a non-participant (or an unknown id) gets `404` — the API never reveals that a
room exists to someone who isn't in it.

Errors: `401`, `404`

### `POST /rooms/join`

Join using ONLY the invite code (invitees have the code, not the room id). The
code is resolved to a room via Redis (`invite:{code}`, set on create — Lesson 05).

Request: `{ "inviteCode": "Q7X4LM" }`

Response `201`: the room shape (caller added to `participants`).

Errors: `400` (invalid/expired code), `401`

### `POST /rooms/:id/join`

Request: `{ "inviteCode": "Q7X4LM" }`

Response `201`: the room shape (caller added to `participants`).

Errors: `400` (wrong invite code), `401`, `403` (draw already done), `404`

### `POST /rooms/:id/draw`

Requires `room:draw` (owner-only). Requires at least 3 participants and a
`pending` room. Produces a derangement (no one is their own giftee) and saves all
assignments in a single atomic document write.

Response `200`: the room shape with `status: "drawn"` and `drawDate` set.

Errors: `400` (fewer than 3 participants / already drawn), `401`, `403` (missing `room:draw`), `404`

### `GET /rooms/:id/assignment`

Your giftee for a drawn room. Only a participant may read it; a non-participant
(or unknown id) gets `404` — same as `GET /rooms/:id`, the API never leaks a
room's existence.

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

Errors: `400` (draw not done yet), `401`, `404` (not found / not a participant)

### `PATCH /rooms/:id`

Requires `room:edit` (owner-only). Edit room fields.

Request: `{ "name": "Renamed room" }`

Response `200`: the room shape.

Errors: `400`, `401`, `403` (missing `room:edit`), `404`

### `DELETE /rooms/:id`

Requires `room:delete` (owner-only). Deletes the room.

Response `204`: no content.

Errors: `401`, `403` (missing `room:delete`), `404`

### `DELETE /rooms/:id/members/:userId`

Requires `room:kick` (owner-only). Removes a member from the room. The owner
cannot be removed.

Response `204`: no content.

Errors: `400` (cannot remove the owner), `401`, `403` (missing `room:kick`), `404` (room or member not found)

### `POST /rooms/:id/invite-code/regenerate`

Requires `room:invite` (owner-only). Generates a fresh unique invite code,
invalidating the old one.

Response `200`: the room shape with the new `inviteCode`.

Errors: `401`, `403` (missing `room:invite`), `404`

## Wishlist

A wishlist is a list of plain strings, scoped to `{ roomId, userId }`.

### `PUT /rooms/:roomId/wishlist`

Requires `wishlist:set` (any participant). Upserts the caller's wishlist for the room.

Request: `{ "items": ["Wool socks", "A good book"] }`

Response `200`:

```json
{
  "roomId": "665f0c2ab7d13a5e8b1c4d9f",
  "userId": "665f0c2ab7d13a5e8b1c4d1a",
  "items": ["Wool socks", "A good book"]
}
```

Errors: `400`, `401`, `403` (missing `wishlist:set`), `404`

### `GET /rooms/:roomId/wishlist/:userId`

Requires `room:view` (any participant of the room). Response `200`: the wishlist
shape above. If the user has **no** wishlist yet, returns an **empty** one
(`"items": []`) — not a `404`.

Errors: `401`, `403` (missing `room:view`), `404` (room not found / caller is not a participant)
