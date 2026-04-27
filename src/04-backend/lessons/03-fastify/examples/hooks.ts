export {};
// ============================================
// FASTIFY HOOKS (Lifecycle) Example
// ============================================
// Run this file with: npx ts-node src/04-backend/lessons/03-fastify/examples/hooks.ts
//
// Test with:
//   curl http://localhost:3000/health
//   curl http://localhost:3000/api/protected
//   curl http://localhost:3000/api/protected -H "Authorization: Bearer test-token"
//   curl -X POST http://localhost:3000/api/data -H "Content-Type: application/json" -d '{"value":42}'

import Fastify, { FastifyError } from 'fastify';

// -------------------------------------------------------
// Declaration merging — tell TypeScript about custom request properties
// -------------------------------------------------------
// When you add properties to request via decorateRequest(), TypeScript
// doesn't know about them. "declare module" merges your types into
// Fastify's existing interfaces, so request.startTime and request.userId
// are properly typed — no "as any" needed.
declare module 'fastify' {
  interface FastifyRequest {
    startTime: number;
    userId: string;
  }
}

const app = Fastify({ logger: false }); // We'll do custom logging via hooks

// Register decorators BEFORE hooks that use them
app.decorateRequest('startTime', 0);
app.decorateRequest('userId', '');

// -------------------------------------------------------
// 1. onRequest — runs first, before body parsing
// -------------------------------------------------------
// Good for: request logging, early rejection, attaching request IDs
app.addHook('onRequest', async (request, _reply) => {
  // Attach a start time to measure response time
  request.startTime = Date.now();  // ← properly typed, no "as any"
  console.log(`\n→ [onRequest] ${request.method} ${request.url}`);
});

// -------------------------------------------------------
// 2. preHandler — runs after parsing + validation, before the handler
// -------------------------------------------------------
// Good for: authentication, authorization, loading context
app.addHook('preHandler', async (request, reply) => {
  console.log(`  [preHandler] Checking auth for ${request.url}`);

  // Skip auth for /health
  if (request.url === '/health') {
    console.log('  [preHandler] /health — skipping auth');
    return;
  }

  // Check for Authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('  [preHandler] No token — sending 401');
    reply.status(401).send({ error: 'Unauthorized', message: 'Bearer token required' });
    return; // Returning from hook with reply.send() stops the lifecycle
  }

  // Simulate token validation
  const token = authHeader.slice(7);
  request.userId = `user-from-${token}`;
  console.log(`  [preHandler] Authenticated as ${request.userId}`);
});

// -------------------------------------------------------
// 3. preSerialization — runs after handler, before serializing the response
// -------------------------------------------------------
// Good for: adding metadata to responses, wrapping response data
app.addHook('preSerialization', async (_request, reply, payload) => {
  console.log('  [preSerialization] Wrapping payload');

  // Wrap every response in a standard envelope
  if (typeof payload === 'object' && payload !== null && !('_wrapped' in (payload as Record<string, unknown>))) {
    return {
      success: reply.statusCode < 400,
      data: payload,
      _wrapped: true, // prevent double-wrapping
    };
  }
  return payload;
});

// -------------------------------------------------------
// 4. onSend — runs after serialization, payload is a string
// -------------------------------------------------------
// Good for: modifying response headers, logging response size
app.addHook('onSend', async (_request, reply, payload) => {
  const size = typeof payload === 'string' ? payload.length : 0;
  console.log(`  [onSend] Response size: ${size} bytes`);
  // You could add custom headers here:
  reply.header('X-Response-Size', String(size));
  return payload; // must return payload (modified or original)
});

// -------------------------------------------------------
// 5. onResponse — runs after the response is fully sent
// -------------------------------------------------------
// Good for: final logging, metrics, cleanup
app.addHook('onResponse', async (request, reply) => {
  const elapsed = Date.now() - request.startTime;
  console.log(`← [onResponse] ${request.method} ${request.url} → ${reply.statusCode} (${elapsed}ms)`);
});

// -------------------------------------------------------
// 6. onError — runs when an error is thrown in the handler or hooks
// -------------------------------------------------------
app.addHook('onError', async (request, _reply, error) => {
  console.log(`  [onError] ${request.url}: ${error.message}`);
});

// -------------------------------------------------------
// Routes
// -------------------------------------------------------
app.get('/health', async () => {
  return { status: 'ok' };
});

app.get('/api/protected', async (request) => {
  return {
    message: 'You have access!',
    userId: request.userId,  // ← typed via declaration merging
  };
});

app.post<{ Body: { value: number } }>('/api/data', async (request) => {
  return {
    received: request.body.value,
    doubled: request.body.value * 2,
    userId: request.userId,
  };
});

// Route that throws an error (demonstrates onError hook)
app.get('/api/error', async () => {
  throw new Error('Something went wrong intentionally');
});

// -------------------------------------------------------
// Error handler
// -------------------------------------------------------
app.setErrorHandler((error: FastifyError, _request, reply) => {
  console.log(`  [errorHandler] ${error.message}`);
  reply.status(error.statusCode ?? 500).send({
    error: error.message,
  });
});

// -------------------------------------------------------
// Start
// -------------------------------------------------------
app.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Hooks demo server running at http://localhost:3000');
  console.log('\nTry these to see hook order in the console:');
  console.log('  curl http://localhost:3000/health');
  console.log('  curl http://localhost:3000/api/protected');
  console.log('  curl http://localhost:3000/api/protected -H "Authorization: Bearer test-token"');
  console.log('  curl http://localhost:3000/api/error');
  console.log('\nPress Ctrl+C to stop');
});
