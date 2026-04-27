# App Task: Notifications CRUD in santa-notifications

Add REST endpoints for notifications to your `santa-notifications` Fastify server.
This is an in-memory CRUD — no database yet (that comes in lesson 07).

## Data Model

```typescript
interface Notification {
  id: number;
  userId: string;
  type: string;       // e.g. "room.created", "user.joined", "draw.completed"
  message: string;
  read: boolean;
  createdAt: string;  // ISO timestamp
}
```

## Endpoints to Implement

Add these routes to `santa-notifications/src/server.ts` (alongside the existing `/health`):

### 1. GET /api/notifications

Return all notifications. Support optional query parameter `?userId=` to filter by user.

- `GET /api/notifications` → 200, returns all notifications
- `GET /api/notifications?userId=alice` → 200, returns only alice's notifications

### 2. GET /api/notifications/:id

Return a single notification by id.

- Found → 200 with the notification
- Not found → 404 `{ error: "Notification not found" }`

### 3. POST /api/notifications

Create a new notification.

- Body: `{ userId: string, type: string, message: string }`
- Validate: all three fields must be present strings, otherwise → 400 `{ error: "..." }`
- Auto-set: `id` (incrementing), `read: false`, `createdAt` (ISO timestamp)
- Success → 201 with the created notification

### 4. PATCH /api/notifications/:id/read

Mark a notification as read.

- Found → 200 with updated notification (`read: true`)
- Not found → 404

### 5. DELETE /api/notifications/:id

Delete a notification.

- Found → 204 (no body)
- Not found → 404

## Hints

You already have a `/health` route in `server.ts`. New routes follow the same pattern:

```typescript
// GET with params
app.get('/api/notifications/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  // ...
});

// POST with body
app.post('/api/notifications', async (request, reply) => {
  const body = request.body as { userId?: string; type?: string; message?: string };
  // ...
  reply.code(201);
  return createdNotification;
});

// Access query params
app.get('/api/notifications', async (request, reply) => {
  const { userId } = request.query as { userId?: string };
  // ...
});

// 404
reply.code(404);
return { error: 'Not found' };

// 204 no body
reply.code(204).send();
```

## Verification

```bash
cd santa-notifications
npx ts-node src/server.ts

# In another terminal:

# Create notifications
curl -s -X POST http://localhost:3002/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId":"alice","type":"room.created","message":"New room: Holiday Party"}'

curl -s -X POST http://localhost:3002/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId":"bob","type":"user.joined","message":"Alice joined your room"}'

# List all
curl -s http://localhost:3002/api/notifications
# Expected: 2 notifications

# Filter by user
curl -s http://localhost:3002/api/notifications?userId=alice
# Expected: 1 notification

# Get by id
curl -s http://localhost:3002/api/notifications/1
# Expected: alice's notification

# Mark as read
curl -s -X PATCH http://localhost:3002/api/notifications/1/read
# Expected: { ..., "read": true }

# Delete
curl -s -X DELETE http://localhost:3002/api/notifications/2 -w "HTTP %{http_code}\n"
# Expected: HTTP 204

# 404
curl -s http://localhost:3002/api/notifications/999
# Expected: { "error": "Notification not found" }

# Validation
curl -s -X POST http://localhost:3002/api/notifications \
  -H "Content-Type: application/json" -d '{}'
# Expected: 400 with error message
```
