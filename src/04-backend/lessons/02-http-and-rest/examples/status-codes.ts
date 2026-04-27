export {};
// ============================================
// HTTP STATUS CODES Example
// ============================================
// Run this file with: npx ts-node src/04-backend/lessons/02-http-and-rest/examples/status-codes.ts
//
// Test with curl -v to see headers and status codes:
//   curl -v http://localhost:3000/api/demo/ok
//   curl -v -X POST http://localhost:3000/api/demo/create -H "Content-Type: application/json" -d '{"name":"Test"}'
//   curl -v -X DELETE http://localhost:3000/api/demo/delete/1
//   curl -v http://localhost:3000/api/demo/bad-request
//   curl -v http://localhost:3000/api/demo/not-found
//   curl -v http://localhost:3000/api/demo/error

import * as http from 'node:http';

const PORT = 3000;

function sendJson(res: http.ServerResponse, statusCode: number, data?: unknown): void {
  if (data === undefined) {
    res.writeHead(statusCode);
    res.end();
    return;
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const { method, url } = req;

  // --- 200 OK: Successful GET ---
  if (url === '/api/demo/ok') {
    console.log(`${method} ${url} -> 200`);
    sendJson(res, 200, {
      message: '200 OK — Request succeeded',
      usage: 'Standard response for successful GET, PUT, PATCH',
    });
    return;
  }

  // --- 201 Created: Resource successfully created ---
  if (url === '/api/demo/create' && method === 'POST') {
    console.log(`${method} ${url} -> 201`);
    const newResource = { id: 42, name: 'Test', createdAt: new Date().toISOString() };
    res.writeHead(201, {
      'Content-Type': 'application/json',
      'Location': '/api/demo/items/42', // Points to the new resource
    });
    res.end(JSON.stringify(newResource));
    return;
  }

  // --- 204 No Content: Success with no body ---
  if (url?.startsWith('/api/demo/delete/') && method === 'DELETE') {
    console.log(`${method} ${url} -> 204`);
    sendJson(res, 204);
    return;
  }

  // --- 400 Bad Request: Invalid input ---
  if (url === '/api/demo/bad-request') {
    console.log(`${method} ${url} -> 400`);
    sendJson(res, 400, {
      error: 'Bad Request',
      message: '400 — The request body is malformed or missing required fields',
      details: [
        { field: 'email', message: 'email is required' },
        { field: 'name', message: 'name must be at least 2 characters' },
      ],
    });
    return;
  }

  // --- 401 Unauthorized: Missing or invalid auth ---
  if (url === '/api/demo/unauthorized') {
    console.log(`${method} ${url} -> 401`);
    sendJson(res, 401, {
      error: 'Unauthorized',
      message: '401 — Authentication required. Provide a valid Bearer token.',
    });
    return;
  }

  // --- 403 Forbidden: Authenticated but not allowed ---
  if (url === '/api/demo/forbidden') {
    console.log(`${method} ${url} -> 403`);
    sendJson(res, 403, {
      error: 'Forbidden',
      message: '403 — You are authenticated but lack permission for this action',
    });
    return;
  }

  // --- 404 Not Found: Resource does not exist ---
  if (url === '/api/demo/not-found') {
    console.log(`${method} ${url} -> 404`);
    sendJson(res, 404, {
      error: 'Not Found',
      message: '404 — The requested resource does not exist',
    });
    return;
  }

  // --- 409 Conflict: State conflict ---
  if (url === '/api/demo/conflict') {
    console.log(`${method} ${url} -> 409`);
    sendJson(res, 409, {
      error: 'Conflict',
      message: '409 — A user with this email already exists',
    });
    return;
  }

  // --- 500 Internal Server Error: Unexpected failure ---
  if (url === '/api/demo/error') {
    console.log(`${method} ${url} -> 500`);
    sendJson(res, 500, {
      error: 'Internal Server Error',
      message: '500 — Something went wrong on the server side',
    });
    return;
  }

  // Default: 404
  console.log(`${method} ${url} -> 404 (no matching route)`);
  sendJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`Status codes demo server at http://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log(`  GET    /api/demo/ok            -> 200 OK`);
  console.log(`  POST   /api/demo/create         -> 201 Created`);
  console.log(`  DELETE /api/demo/delete/1        -> 204 No Content`);
  console.log(`  GET    /api/demo/bad-request     -> 400 Bad Request`);
  console.log(`  GET    /api/demo/unauthorized    -> 401 Unauthorized`);
  console.log(`  GET    /api/demo/forbidden       -> 403 Forbidden`);
  console.log(`  GET    /api/demo/not-found       -> 404 Not Found`);
  console.log(`  GET    /api/demo/conflict        -> 409 Conflict`);
  console.log(`  GET    /api/demo/error           -> 500 Internal Server Error`);
  console.log('\nUse "curl -v" to see headers and status codes');
  console.log('Press Ctrl+C to stop');
});
