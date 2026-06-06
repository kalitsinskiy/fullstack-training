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

### `POST /rooms`

Request:

```json
{
  "name": "New Year team building"
}
```

Response `201`:

```json
{
  "id": "665f0c2ab7d13a5e8b1c4d9f",
  "name": "New Year team building",
  "ownerId": "665f0c2ab7d13a5e8b1c4d1a",
  "code": "Q7X4LM",
  "members": ["665f0c2ab7d13a5e8b1c4d1a"],
  "status": "pending",
  "drawDate": "2025-12-20T00:00:00.000Z"
}
```

Errors: `400`, `401`

### `GET /rooms?page=1&limit=10`

Response `200`:

```json
{
  "data": [
    {
      "id": "665f0c2ab7d13a5e8b1c4d9f",
      "name": "New Year team building",
      "ownerId": "665f0c2ab7d13a5e8b1c4d1a",
      "code": "Q7X4LM",
      "members": ["665f0c2ab7d13a5e8b1c4d1a"],
      "status": "pending",
      "drawDate": "2025-12-20T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

Notes:

- `page` defaults to `1` and is clamped to a minimum of `1`
- `limit` defaults to `10`, minimum `1`, maximum `100`
- `totalPages` is always at least `1`, even when `data` is empty

Errors: `401`

### `GET /rooms/:id`

Response `200`: same room shape as `POST /rooms`

Errors: `401`, `404`

### `POST /rooms/:code/join`

Request body: `{}`

Response `201`: same room shape as `POST /rooms`

Errors: `401`, `404`

## Wishlist

### `POST /rooms/:roomId/wishlist`

Request:

```json
{
  "items": [
    {
      "name": "Warm socks",
      "url": "https://example.com/socks",
      "priority": 1
    }
  ]
}
```

Response `201`:

```json
{
  "roomId": "665f0c2ab7d13a5e8b1c4d9f",
  "userId": "665f0c2ab7d13a5e8b1c4d1a",
  "items": [
    {
      "name": "Warm socks",
      "url": "https://example.com/socks",
      "priority": 1
    }
  ]
}
```

Errors: `400`, `401`

### `GET /rooms/:roomId/wishlist/me`

Response `200`: same shape as `POST /rooms/:roomId/wishlist`

Errors: `401`, `404`
