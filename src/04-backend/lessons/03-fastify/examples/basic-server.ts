export {};
// ============================================
// FASTIFY BASIC SERVER Example
// ============================================
// Run this file with: npx ts-node src/04-backend/lessons/03-fastify/examples/basic-server.ts
//
// Test with:
//   curl http://localhost:3000/health
//   curl http://localhost:3000/users/42
//   curl http://localhost:3000/users/42?fields=name,email
//   curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com"}'
//   curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"A"}'

import Fastify from 'fastify';

const app = Fastify({
  logger: true,  // Built-in Pino logger — structured JSON logging
});

// --- Simple route (no schema) ---
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// --- Typed route with params and querystring ---
app.get<{
  Params: { id: string };
  Querystring: { fields?: string };
}>('/users/:id', async (request) => {
  const { id } = request.params;          // typed as { id: string }
  const { fields } = request.query;        // typed as { fields?: string }

  const user = { id, name: 'Alice', email: 'alice@example.com', age: 30 };

  // If ?fields=name,email, return only those fields
  if (fields) {
    const keys = fields.split(',');
    const filtered = Object.fromEntries(
      Object.entries(user).filter(([key]) => keys.includes(key) || key === 'id')
    );
    return filtered;
  }

  return user;
});

// --- Route with JSON Schema validation ---
// Fastify validates the body BEFORE your handler runs.
// If validation fails, Fastify automatically returns 400 with details.
app.post<{
  Body: { name: string; email: string };
}>('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100 },
        email: { type: 'string', format: 'email' },
      },
      additionalProperties: false,
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const { name, email } = request.body;  // validated and typed
  const newUser = { id: Date.now(), name, email };

  reply.status(201);
  return newUser;
});

// --- Custom 404 handler ---
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} does not exist`,
  });
});

// --- Start the server ---
const start = async () => {
  try {
    await app.listen({ port: 3000 });
    console.log('\nServer is running. Try:');
    console.log('  curl http://localhost:3000/health');
    console.log('  curl http://localhost:3000/users/42');
    console.log('  curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d \'{"name":"Alice","email":"alice@example.com"}\'');
    console.log('  curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d \'{"name":"A"}\' # validation error!');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
