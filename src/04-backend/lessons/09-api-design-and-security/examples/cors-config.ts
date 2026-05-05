// ============================================
// CORS Configuration
// ============================================
// Run: npx ts-node src/04-backend/lessons/09-api-design-and-security/examples/cors-config.ts
// This example creates a simple Fastify server to demonstrate CORS behavior.

import Fastify from 'fastify';
import cors from '@fastify/cors';

async function main(): Promise<void> {
  const app = Fastify({ logger: false });

  // --- 1. Basic CORS setup ---
  // Allow specific origins (recommended for production)
  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://localhost:5173'], // frontend origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,         // allow cookies and Authorization header
    maxAge: 86400,             // cache preflight response for 24 hours (seconds)
  });

  // --- Example routes ---

  app.get('/api/public', async () => {
    return { message: 'This is a public endpoint' };
  });

  app.get('/api/rooms', async () => {
    return {
      data: [
        { id: '1', name: 'Office Party' },
        { id: '2', name: 'Family Gift Exchange' },
      ],
    };
  });

  app.post('/api/rooms', async (request) => {
    return { message: 'Room created', body: request.body };
  });

  // --- Start server ---
  await app.listen({ port: 3000 });
  console.log('=== CORS Example Server ===');
  console.log('Server running at http://localhost:3000');
  console.log('\nTest CORS behavior:');
  console.log('');
  console.log('1. Simple GET request (no preflight):');
  console.log('   curl -v http://localhost:3000/api/rooms');
  console.log('');
  console.log('2. Preflight + POST request:');
  console.log('   curl -v -X OPTIONS http://localhost:3000/api/rooms \\');
  console.log('     -H "Origin: http://localhost:3000" \\');
  console.log('     -H "Access-Control-Request-Method: POST" \\');
  console.log('     -H "Access-Control-Request-Headers: content-type,authorization"');
  console.log('');
  console.log('3. Actual POST:');
  console.log('   curl -v -X POST http://localhost:3000/api/rooms \\');
  console.log('     -H "Origin: http://localhost:3000" \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"name":"Test Room"}\'');
  console.log('');
  console.log('4. Request from disallowed origin:');
  console.log('   curl -v http://localhost:3000/api/rooms \\');
  console.log('     -H "Origin: http://evil-site.com"');
  console.log('');
  console.log('Press Ctrl+C to stop.');

  /*
  --- CORS configuration options explained ---

  origin:
    - string: single allowed origin ('http://localhost:3000')
    - string[]: multiple allowed origins
    - true: allow ALL origins (not recommended for production)
    - RegExp: pattern match (e.g., /\.example\.com$/)
    - function: dynamic check: (origin, callback) => callback(null, isAllowed)

  methods:
    - HTTP methods the server allows

  allowedHeaders:
    - Headers the client is allowed to send

  exposedHeaders:
    - Headers the browser is allowed to read from the response
    - By default only: Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma

  credentials:
    - If true, allows cookies and Authorization header
    - Cannot be used with origin: '*' (must specify exact origins)

  maxAge:
    - How long (seconds) the browser caches preflight results
    - Reduces OPTIONS requests
  */
}

main().catch(console.error);

export {};
