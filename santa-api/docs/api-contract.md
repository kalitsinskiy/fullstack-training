# Santa API — Contract

NestJS 11 + Fastify, backed by MongoDB.

- **Base URL (local):** `http://localhost:3001`
- **Swagger UI:** `http://localhost:3001/api-docs`
- **Auth:** JWT Bearer — `Authorization: Bearer <token>` on all 🔒 routes
- **Rate limiting:** 100 req / 60 s globally; stricter limits on auth endpoints

## Environment variables

| Variable     | Required | Default                               |
|--------------|----------|---------------------------------------|
| `JWT_SECRET` | Yes      | —                                     |
| `MONGO_URL`  | No       | `mongodb://localhost:27017/santa-api` |
| `NODE_ENV`   | No       | unset → pino-pretty dev logging       |

---

## Endpoint overview

| Method   | Path                                    | Auth | Description                          |
|----------|-----------------------------------------|------|--------------------------------------|
| GET      | `/`                                     | —    | Hello world greeting                 |
| GET      | `/health`                               | —    | Health check                         |
| POST     | `/auth/register`                        | —    | Register new user, returns JWT       |
| POST     | `/auth/login`                           | —    | Login, returns JWT                   |
| POST     | `/users`                                | —    | Create user directly (low-level)     |
| GET      | `/users/me`                             | 🔒   | Get current user profile             |
| PATCH    | `/users/me`                             | 🔒   | Update current user                  |
| DELETE   | `/users/me`                             | 🔒   | Delete current user                  |
| GET      | `/rooms`                                | 🔒   | List all rooms (paginated)           |
| GET      | `/rooms/:id`                            | 🔒   | Get room by MongoDB ID               |
| POST     | `/rooms`                                | 🔒   | Create room                          |
| PATCH    | `/rooms/:id`                            | 🔒   | Update room name                     |
| DELETE   | `/rooms/:id`                            | 🔒   | Delete room                          |
| POST     | `/rooms/:code/join`                     | 🔒   | Join room by invite code             |
| POST     | `/rooms/:roomCode/wishlist`             | 🔒   | Create or replace wishlist for user  |
| GET      | `/rooms/:roomCode/wishlist/:userId`     | 🔒   | Get user's wishlist                  |
| PATCH    | `/rooms/:roomCode/wishlist/:userId`     | 🔒   | Update user's wishlist items         |
| DELETE   | `/rooms/:roomCode/wishlist/:userId`     | 🔒   | Delete user's wishlist               |

---

## Root

### `GET /`
No auth. Returns a greeting string.

**Response (200):** `"Hello World!"`

### `GET /health`
No auth. Liveness probe.

**Response (200):** `{ "status": "ok" }`

---

## Auth — `/auth`

### `POST /auth/register`
Rate limit: 20 req / 60 s.

**Body**
```json
{
  "email": "user@example.com",
  "password": "atleast10chars",
  "displayName": "Jane"
}
```
- `password` min length: 10
- `displayName` min length: 2

**201** `{ "accessToken": "<jwt>" }` — expires in 1 h  
**400** validation error  
**409** email already taken

### `POST /auth/login`
Rate limit: 50 req / 60 s.

**Body**
```json
{
  "email": "user@example.com",
  "password": "atleast8ch"
}
```
- `password` min length: 8

**200** `{ "accessToken": "<jwt>" }`  
**401** invalid credentials

JWT payload: `{ sub: userId, email, role }`

---

## Users — `/users`

### `POST /users`
No auth. Low-level endpoint that accepts a pre-hashed password directly. End users should register via `POST /auth/register` instead.

**Body**
```json
{
  "email": "user@example.com",
  "displayName": "Jane",
  "passwordHash": "$2b$10$..."
}
```

**201** `UserResponse`

### `GET /users/me` 🔒
Returns the authenticated user's profile.

**200** `UserResponse`
```json
{
  "id": "<mongo-id>",
  "email": "user@example.com",
  "displayName": "Jane",
  "role": "user",
  "createdAt": "<ISO date>",
  "updatedAt": "<ISO date>"
}
```
**404** user not found

### `PATCH /users/me` 🔒
Updates the authenticated user's profile.

**Body** (all fields optional)
```json
{
  "email": "new@example.com",
  "displayName": "New Name"
}
```

**200** updated `UserResponse`  
**404** user not found

### `DELETE /users/me` 🔒
Deletes the authenticated user's account.

**200** `{ "success": true }`  
**404** user not found

---

## Rooms — `/rooms`

All room endpoints require auth 🔒.

Rooms have two identifiers:
- **`id`** — MongoDB ObjectId, used in CRUD routes
- **`inviteCode`** — 5-char alphanumeric (e.g. `AB1C2`), used in join and wishlist routes

### `GET /rooms` 🔒
Paginated list of all rooms, sorted by `createdAt` desc.

**Query params**

| Param   | Default | Max |
|---------|---------|-----|
| `page`  | `1`     | —   |
| `limit` | `10`    | 100 |

**200**
```json
{
  "data": [ /* Room[] */ ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

### `GET /rooms/:id` 🔒
Get a single room by MongoDB `_id`.

**200** `RoomResponse`
```json
{
  "id": "<mongo-id>",
  "name": "Family Santa 2024",
  "creatorId": "<mongo-id>",
  "inviteCode": "AB1C2",
  "participants": ["<mongo-id>"],
  "status": "pending",
  "drawDate": null,
  "createdAt": "<ISO date>",
  "updatedAt": "<ISO date>"
}
```
**404** not found

`status` is `"pending"` or `"drawn"`.

### `POST /rooms` 🔒
Create a new room. The creator is automatically added to `participants` and a random `inviteCode` is generated.

**Body**
```json
{
  "name": "Family Santa 2024",
  "ownerId": "<mongo-id-or-uuid>"
}
```
- `name` min length: 3
- `ownerId` length: 20–30 chars

**201** `RoomResponse`

### `PATCH /rooms/:id` 🔒
Update the room name.

**Body**
```json
{ "name": "Updated Name" }
```
- `name` min length: 3

**200** updated `RoomResponse`  
**404** not found

### `DELETE /rooms/:id` 🔒
Delete a room.

**200** `{ "success": true }`  
**404** not found

### `POST /rooms/:code/join` 🔒
Add a user to `participants` by invite code (idempotent via `$addToSet`).

`:code` is the room's `inviteCode`.

**Body**
```json
{ "userId": "550e8400-e29b-41d4-a716-446655440000" }
```
- `userId` — UUID v4

**201** updated `RoomResponse`  
**404** room not found

---

## Wishlists — `/rooms/:roomCode/wishlist`

All wishlist endpoints require auth 🔒.  
`:roomCode` is the room's `inviteCode`, **not** its `id`.

### `POST /rooms/:roomCode/wishlist` 🔒
Create or fully replace a user's wishlist in a room (upsert).

**Body**
```json
{
  "userId": "<mongo-id>",
  "items": [
    { "name": "Bicycle", "url": "https://example.com/bike", "priority": 1 }
  ]
}
```
- `items[].name` min length: 1, required
- `items[].url` valid URL, optional
- `items[].priority` integer ≥ 0, optional

**201** `WishlistResponse`
```json
{
  "id": "<mongo-id>",
  "userId": "<mongo-id>",
  "roomId": "<mongo-id>",
  "items": [ { "name": "Bicycle", "url": "...", "priority": 1 } ],
  "createdAt": "<ISO date>",
  "updatedAt": "<ISO date>"
}
```
**404** room or user not found

### `GET /rooms/:roomCode/wishlist/:userId` 🔒
Get a user's wishlist.

**200** `WishlistResponse`  
**404** room, user, or wishlist not found

### `PATCH /rooms/:roomCode/wishlist/:userId` 🔒
Replace all wishlist items for a user (same upsert semantics as POST).

**Body**
```json
{
  "items": [
    { "name": "Bicycle", "url": "https://example.com/bike", "priority": 1 }
  ]
}
```

**200** updated `WishlistResponse`  
**404** room or user not found

### `DELETE /rooms/:roomCode/wishlist/:userId` 🔒
Delete a user's wishlist.

**200** `{ "success": true }`  
**404** room, user, or wishlist not found

---

## Error shape

All errors follow:
```json
{
  "sucess": false,
  "statusCode": 404,
  "message": "...",
  "timestamp": "<ISO date>"
}
```

> Note: `"sucess"` is a known typo in `src/common/filters/all-exceptions.filter.ts`.

---

## Known gaps

- **No draw endpoint** — `Room.status` and `Room.drawDate` exist but there is no route to trigger the Secret Santa draw.
- **`POST /users` is unprotected** — accepts a raw `passwordHash`; intended for internal use only.
- **No RBAC** — a `role` field (`"user"` | `"admin"`) exists on users but no role guards are enforced.
