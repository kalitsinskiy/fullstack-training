# Santa API

NestJS 11 + Fastify REST API backed by MongoDB.

- **Base URL (local):** `http://localhost:3001`
- **Swagger UI:** `http://localhost:3001/api-docs`
- **Auth:** JWT Bearer — include `Authorization: Bearer <token>` on protected routes
- **Rate limiting:** 100 req / 60 s globally; stricter limits on auth endpoints

## Environment variables

| Variable    | Required | Default                                  |
|-------------|----------|------------------------------------------|
| `JWT_SECRET` | Yes      | —                                        |
| `MONGO_URL`  | No       | `mongodb://localhost:27017/santa-api`    |
| `NODE_ENV`   | No       | unset → pino-pretty dev logging          |

---

## Auth — `/auth`

### POST `/auth/register`
Rate limit: 20 req / 60 s.

**Body**
```json
{ "email": "user@example.com", "password": "atleast10chars", "displayName": "Jane" }
```
**201** `{ "accessToken": "<jwt>" }` — token expires in 1 hour  
**400** validation error · **409** email already taken

### POST `/auth/login`
Rate limit: 50 req / 60 s.

**Body**
```json
{ "email": "user@example.com", "password": "atleast8ch" }
```
**200** `{ "accessToken": "<jwt>" }`  
**401** invalid credentials

---

## Users — `/users`

### GET `/users/me` 🔒
Returns the authenticated user's profile.

**200**
```json
{ "id": "…", "email": "…", "displayName": "…", "role": "user", "createdAt": "…", "updatedAt": "…" }
```

### PATCH `/users/me` 🔒
**Body** (all fields optional)
```json
{ "email": "new@example.com", "displayName": "New Name" }
```
**200** updated user profile

### DELETE `/users/me` 🔒
**200** `{ "success": true }`

---

## Rooms — `/rooms`

All room endpoints require auth. 🔒

Rooms have two identifiers:
- **`id`** — MongoDB ObjectId, used in standard CRUD routes
- **`inviteCode`** — 6-char alphanumeric (e.g. `AB1C2D`), used in join and wishlist routes

### GET `/rooms`
**Query params:** `page` (default 1), `limit` (default 10, max 100)

**200**
```json
{
  "data": [ /* Room[] */ ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

### GET `/rooms/:id`
**200**
```json
{
  "id": "…", "name": "Family Santa 2024", "creatorId": "…",
  "inviteCode": "AB1C2D", "participants": ["…"],
  "status": "pending", "drawDate": null, "createdAt": "…", "updatedAt": "…"
}
```
**404** not found

### POST `/rooms`
**Body**
```json
{ "name": "Family Santa 2024", "ownerId": "<userId>" }
```
`name` min 3 chars. The creator is automatically added to `participants` and a random `inviteCode` is generated.  
**201** Room

### PATCH `/rooms/:id`
**Body**
```json
{ "name": "Updated Name" }
```
**200** updated Room · **404** not found

### DELETE `/rooms/:id`
**200** `{ "success": true }` · **404** not found

### POST `/rooms/:inviteCode/join`
Adds a user to `participants` (idempotent via `$addToSet`).

**Body**
```json
{ "userId": "<uuid-v4>" }
```
**201** updated Room · **404** room not found

---

## Wishlists — `/rooms/:roomCode/wishlist`

All wishlist endpoints require auth. 🔒  
`:roomCode` is the room's `inviteCode`, not its `id`.

### POST `/rooms/:roomCode/wishlist`
Create or fully replace a wishlist for a user in a room (upsert).

**Body**
```json
{
  "userId": "<mongoId>",
  "items": [
    { "name": "Bicycle", "url": "https://…", "priority": 1 }
  ]
}
```
`url` and `priority` are optional. **201** Wishlist

### GET `/rooms/:roomCode/wishlist/:userId`
**200**
```json
{
  "id": "…", "userId": "…", "roomId": "…",
  "items": [ { "name": "Bicycle", "url": "…", "priority": 1 } ],
  "createdAt": "…", "updatedAt": "…"
}
```

### PATCH `/rooms/:roomCode/wishlist/:userId`
Replaces all items (same upsert as POST, body omits `userId`).

**Body**
```json
{ "items": [ { "name": "Bicycle", "url": "…", "priority": 1 } ] }
```
**200** updated Wishlist

### DELETE `/rooms/:roomCode/wishlist/:userId`
**200** `{ "success": true }` · **404** room / user / wishlist not found

---

## Error shape

All errors follow:
```json
{ "sucess": false, "statusCode": 404, "message": "…", "timestamp": "…" }
```
> Note: `"sucess"` is a known typo in the exception filter (`src/common/filters/all-exceptions.filter.ts`).

---

## Known gaps

- **No draw endpoint** — `Room.status` and `Room.drawDate` fields exist but there is no route to trigger the Secret Santa draw.
- **`POST /users` is unprotected** — accepts a raw `passwordHash`; intended for internal use only. End users should register via `POST /auth/register`.
- **No RBAC** — a `role` field (`"user"` | `"admin"`) exists on users but no role guards are enforced in any controller.
