export {};
// ============================================
// REST-COMPLIANT CRUD SERVER Exercise
// ============================================
// Run: npx ts-node src/04-backend/lessons/02-http-and-rest/exercises/crud-server.ts
//
// In lesson 01 you built a basic HTTP server. This exercise focuses on the
// REST and HTTP semantics you learned in this lesson:
//   - Correct status codes (200, 201, 204, 400, 404, 409)
//   - Location header on 201 Created
//   - PUT (full replace) vs PATCH (partial update)
//   - Idempotency: PUT and DELETE must be safe to retry

import * as http from 'node:http';

const PORT = 3000;

// --- Data model ---
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const users: User[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
let nextId = 1; // eslint-disable-line @typescript-eslint/no-unused-vars, prefer-const

// --- Helpers (provided) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseUrl(rawUrl: string) {
  const parsed = new URL(rawUrl, 'http://localhost');
  return { pathname: parsed.pathname, searchParams: parsed.searchParams };
}

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function extractId(url: string): number | null {
  const match = url.match(/^\/api\/users\/(\d+)$/);
  return match ? parseInt(match[1]!, 10) : null;
}

// TODO: Create an HTTP server that implements a User REST API:
//
// 1. GET /api/users
//    → 200 with array of all users
//    Supports ?role=<role> query param for filtering
//
// 2. GET /api/users/:id
//    → 200 with user object
//    → 404 { error: "User not found" }
//
// 3. POST /api/users
//    Body: { name: string, email: string, role: string }
//    - Validate: name, email, role must all be non-empty strings → 400 if invalid
//    - Check email uniqueness: if email already taken → 409 { error: "Email already exists" }
//    - Auto-set: id (incrementing), createdAt (ISO timestamp)
//    → 201 with created user
//    → Must include Location header: `/api/users/<new-id>`
//
// 4. PUT /api/users/:id  (full replacement)
//    Body: { name: string, email: string, role: string }
//    - All three fields MUST be present (it's a full replace) → 400 if any missing
//    - Preserve original id and createdAt
//    → 200 with updated user
//    → 404 if user not found
//    → 409 if email conflicts with another user
//
// 5. PATCH /api/users/:id  (partial update)
//    Body: any subset of { name?: string, email?: string, role?: string }
//    - Only update the fields that are present in the body
//    - Empty body is OK (no-op, return unchanged user)
//    → 200 with updated user
//    → 404 if user not found
//    → 409 if email conflicts with another user
//
// 6. DELETE /api/users/:id
//    → 204 (no body) if deleted
//    → 404 if user not found
//    Must be idempotent: deleting an already-deleted user returns 404 (not an error, just "not found")
//
// 7. Any other route → 404 { error: "Not Found" }
//
// Test with:
//   curl http://localhost:3000/api/users
//   curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@test.com","role":"admin"}'
//   curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"Bob","email":"bob@test.com","role":"user"}'
//   curl -v -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"Alice2","email":"alice@test.com","role":"user"}'  # 409
//   curl http://localhost:3000/api/users/1
//   curl http://localhost:3000/api/users?role=admin
//   curl -X PUT http://localhost:3000/api/users/1 -H "Content-Type: application/json" -d '{"name":"Alice Updated","email":"alice@new.com","role":"superadmin"}'
//   curl -X PATCH http://localhost:3000/api/users/2 -H "Content-Type: application/json" -d '{"role":"moderator"}'
//   curl -X DELETE http://localhost:3000/api/users/1 -w "\nHTTP %{http_code}\n"
//   curl http://localhost:3000/api/users

// Your code here:
const server = http.createServer(async (req, res) => {
  const { method, url = '/' } = req;
  const { pathname, searchParams } = parseUrl(url);
  console.log(`${method} ${pathname}`);

  try {
    // GET /api/users — list all users
    // GET /api/users?role=... — list all users with specific role
    if (method === 'GET' && pathname === '/api/users') {
      const roleFilter = searchParams.get('role');

      if (roleFilter) {
        const filteredUsers = users.filter(
          (user) => user.role.toLowerCase() === roleFilter.toLowerCase()
        );

        sendJson(res, 200, filteredUsers);
        return;
      }

      sendJson(res, 200, users);
      return;
    }

    // GET /api/users/:id - list user with specific id
    if (method === 'GET' && pathname?.startsWith('/api/users')) {
      const id = extractId(pathname);
      const user = users.find((user) => user.id === id);

      if (!user) {
        sendJson(res, 404, { error: 'User Not Found' });
        return;
      }

      sendJson(res, 200, user);
      return;
    }

    // POST /api/users - Create a new User
    if (method === 'POST' && pathname === '/api/users') {
      const body = (await parseBody(req)) as {
        name?: string;
        email?: string;
        role?: string;
      };

      if (!body.email || !body.name || !body.role) {
        sendJson(res, 400, { error: 'Invalid request' });
        return;
      }

      if (users.some((user) => user.email === body.email)) {
        sendJson(res, 409, { error: 'Email is already in use' });
        return;
      }

      const user: User = {
        id: nextId++,
        name: body.name,
        email: body.email,
        role: body.role ?? 'user',
        createdAt: new Date().toISOString(),
      };

      users.push(user);

      res.writeHead(201, {
        'Content-Type': 'application/json',
        Location: `/api/users/${user.id}`,
      });

      res.end(JSON.stringify(user));
      return;
    }

    // PUT /api/users/:id  (full replacement)
    if (method === 'PUT' && pathname.startsWith('/api/users')) {
      const id = extractId(pathname);
      const index = users.findIndex((user) => user.id === id);

      if (index === -1) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      const body = (await parseBody(req)) as {
        name?: string;
        email?: string;
        role?: string;
      };

      if (!body.email || !body.name || !body.role) {
        sendJson(res, 400, { error: 'Invalid request' });
        return;
      }

      if (users.some((user) => user.email === body.email)) {
        sendJson(res, 409, { error: 'Email is already in use' });
        return;
      }

      users[index] = {
        id: users[index]!.id,
        createdAt: users[index]!.createdAt,
        name: body.name,
        email: body.email,
        role: body.role ?? 'user',
      };

      sendJson(res, 200, users[index]);
      return;
    }

    // PATCH /api/users/:id  (partial update)
    if (method === 'PATCH' && pathname.startsWith('/api/users')) {
      const id = extractId(url!);
      const index = users.findIndex((user) => user.id === id);

      if (index === -1) {
        sendJson(res, 404, { error: 'User Not Found' });
        return;
      }

      const body = (await parseBody(req)) as { name?: string; email?: string; role?: string };

      if (body.email !== undefined) {
        if (users.some((user) => user.email === body.email)) {
          sendJson(res, 409, 'Email is already in use');
          return;
        }

        users[index]!.email = body.email;
      }

      if (body.name !== undefined) users[index]!.name = body.name;
      if (body.role !== undefined) users[index]!.role = body.role;

      sendJson(res, 200, users[index]);
      return;
    }

    // DELETE /api/users/:id
    if (method === 'DELETE' && pathname?.startsWith('/api/users/')) {
      const id = extractId(pathname!);
      const index = users.findIndex((user) => user.id === id);

      if (index === -1) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      users.splice(index, 1);
      res.writeHead(204);
      res.end();
      return;
    }

    sendJson(res, 404, { error: 'Not Found' });
  } catch (error) {
    console.log('Error:', error);
    sendJson(res, 500, { error: 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
