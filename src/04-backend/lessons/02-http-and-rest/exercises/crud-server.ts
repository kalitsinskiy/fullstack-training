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

interface UserInput {
  name?: unknown;
  email?: unknown;
  role?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function findUserIndexById(id: number) {
  return users.findIndex((user) => user.id === id);
}

function hasEmailConflict(email: string, excludeUserId?: number) {
  return users.some((user) => user.email === email && user.id !== excludeUserId);
}

function getUserIdFromPath(pathname: string) {
  const match = pathname.match(/^\/api\/users\/(\d+)$/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function validateRequiredUserInput(body: UserInput) {
  if (
    !isNonEmptyString(body.name) ||
    !isNonEmptyString(body.email) ||
    !isNonEmptyString(body.role)
  ) {
    return 'name, email, and role must all be non-empty strings';
  }

  return null;
}

function validatePatchUserInput(body: UserInput) {
  const allowedKeys = ['name', 'email', 'role'];

  for (const key of Object.keys(body)) {
    if (!allowedKeys.includes(key)) {
      return `Unsupported field: ${key}`;
    }
  }

  if ('name' in body && !isNonEmptyString(body.name)) {
    return 'name must be a non-empty string';
  }

  if ('email' in body && !isNonEmptyString(body.email)) {
    return 'email must be a non-empty string';
  }

  if ('role' in body && !isNonEmptyString(body.role)) {
    return 'role must be a non-empty string';
  }

  return null;
}

function getPatchedStringValue(currentValue: string, nextValue: unknown) {
  if (nextValue === undefined) {
    return currentValue;
  }

  if (isNonEmptyString(nextValue)) {
    return nextValue;
  }

  return currentValue;
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

const server = http.createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const { pathname, searchParams } = parseUrl(req.url ?? '/');

  try {
    if (method === 'GET' && pathname === '/api/users') {
      const role = searchParams.get('role');
      const filteredUsers = role ? users.filter((user) => user.role === role) : users;

      sendJson(res, 200, filteredUsers);
      return;
    }

    const userId = getUserIdFromPath(pathname);

    if (method === 'GET' && userId !== null) {
      const user = users.find((item) => item.id === userId);

      if (!user) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      sendJson(res, 200, user);
      return;
    }

    if (method === 'POST' && pathname === '/api/users') {
      const body = (await parseBody(req)) as UserInput;
      const validationError = validateRequiredUserInput(body);

      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      const { name, email, role } = body;

      if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(role)) {
        sendJson(res, 400, { error: 'name, email, and role must all be non-empty strings' });
        return;
      }

      if (hasEmailConflict(email)) {
        sendJson(res, 409, { error: 'Email already exists' });
        return;
      }

      const createdUser: User = {
        id: nextId++,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };

      users.push(createdUser);
      res.writeHead(201, {
        'Content-Type': 'application/json',
        Location: `/api/users/${createdUser.id}`,
      });
      res.end(JSON.stringify(createdUser));
      return;
    }

    if (method === 'PUT' && userId !== null) {
      const userIndex = findUserIndexById(userId);

      if (userIndex === -1) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      const body = (await parseBody(req)) as UserInput;
      const validationError = validateRequiredUserInput(body);

      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      const { name, email, role } = body;

      if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(role)) {
        sendJson(res, 400, { error: 'name, email, and role must all be non-empty strings' });
        return;
      }

      if (hasEmailConflict(email, userId)) {
        sendJson(res, 409, { error: 'Email already exists' });
        return;
      }

      const existingUser = users[userIndex];

      if (!existingUser) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      const updatedUser: User = {
        id: existingUser.id,
        createdAt: existingUser.createdAt,
        name,
        email,
        role,
      };

      users[userIndex] = updatedUser;
      sendJson(res, 200, updatedUser);
      return;
    }

    if (method === 'PATCH' && userId !== null) {
      const userIndex = findUserIndexById(userId);

      if (userIndex === -1) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      const body = (await parseBody(req)) as UserInput;
      const validationError = validatePatchUserInput(body);

      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      const existingUser = users[userIndex];

      if (!existingUser) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      const nextName = getPatchedStringValue(existingUser.name, body.name);
      const nextEmail = getPatchedStringValue(existingUser.email, body.email);
      const nextRole = getPatchedStringValue(existingUser.role, body.role);

      if (nextEmail !== existingUser.email && hasEmailConflict(nextEmail, userId)) {
        sendJson(res, 409, { error: 'Email already exists' });
        return;
      }

      const updatedUser: User = {
        ...existingUser,
        name: nextName,
        email: nextEmail,
        role: nextRole,
      };

      users[userIndex] = updatedUser;
      sendJson(res, 200, updatedUser);
      return;
    }

    if (method === 'DELETE' && userId !== null) {
      const userIndex = findUserIndexById(userId);

      if (userIndex === -1) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      users.splice(userIndex, 1);
      res.writeHead(204);
      res.end();
      return;
    }

    sendJson(res, 404, { error: 'Not Found' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid JSON') {
      sendJson(res, 400, { error: 'Invalid JSON' });
      return;
    }

    sendJson(res, 500, { error: 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
