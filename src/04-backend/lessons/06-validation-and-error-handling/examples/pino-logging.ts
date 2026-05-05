export {};
// ============================================
// PINO LOGGING Example
// ============================================
// Run from santa-notifications/:  npx ts-node examples/06-validation-and-error-handling/pino-logging.ts
//
// Demonstrates:
// - Fastify with Pino logger
// - Log levels (trace, debug, info, warn, error)
// - Child loggers with context
// - Correlation IDs for request tracing
// - Structured logging with objects

import Fastify from 'fastify';

// ============================================
// Fastify with Pino configuration
// ============================================

const app = Fastify({
  logger: {
    level: 'debug', // Show debug and above (trace is hidden)
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  },
  // Generate request IDs automatically
  genReqId: () => crypto.randomUUID().slice(0, 8),
});

// ============================================
// Hook: Add correlation ID to every request
// ============================================

app.addHook('onRequest', async (request) => {
  // Use client-provided correlation ID or generate one
  const correlationId = (request.headers['x-correlation-id'] as string)
    || `corr-${crypto.randomUUID().slice(0, 8)}`;

  // Create a child logger with the correlation ID
  // All logs via request.log will include this field
  request.log = request.log.child({ correlationId });

  request.log.info({ method: request.method, url: request.url }, 'Request started');
});

app.addHook('onResponse', async (request, reply) => {
  request.log.info(
    { statusCode: reply.statusCode, responseTime: reply.elapsedTime.toFixed(1) },
    'Request completed',
  );
});

// ============================================
// Routes demonstrating different log levels
// ============================================

// Simulated service layer
function findUser(id: string, log: typeof app.log) {
  // Child logger inherits all parent context (correlationId, reqId)
  const serviceLog = log.child({ service: 'UserService' });

  serviceLog.debug({ userId: id }, 'Looking up user in database');

  if (id === 'error') {
    serviceLog.error({ userId: id }, 'User lookup failed — database timeout');
    return null;
  }

  if (id === 'unknown') {
    serviceLog.warn({ userId: id }, 'User not found');
    return null;
  }

  serviceLog.debug({ userId: id }, 'User found in database');
  return { id, name: 'Alice', email: 'alice@example.com' };
}

app.get('/users/:id', async (request) => {
  const { id } = request.params as { id: string };

  // request.log already has reqId + correlationId from the hook
  request.log.info({ userId: id }, 'Fetching user');

  const user = findUser(id, request.log);

  if (!user) {
    request.log.warn({ userId: id }, 'Returning 404');
    return { success: false, message: 'User not found' };
  }

  request.log.info({ userId: id, userName: user.name }, 'User found, returning');
  return { success: true, data: user };
});

app.get('/health', async (request) => {
  request.log.debug('Health check called');
  return { status: 'ok', uptime: process.uptime() };
});

// Demonstrating log levels
app.get('/log-levels', async (request) => {
  request.log.trace('This is TRACE — very verbose, hidden by default');
  request.log.debug('This is DEBUG — detailed debugging info');
  request.log.info('This is INFO — normal operation');
  request.log.warn('This is WARN — something unexpected but not fatal');
  request.log.error('This is ERROR — something failed');
  // request.log.fatal('This is FATAL — app should shut down');

  return { message: 'Check the console for log output' };
});

// Demonstrating structured data in logs
app.post('/orders', async (request) => {
  const body = request.body as { product: string; quantity: number };

  // Log structured data — NOT string interpolation
  // GOOD: request.log.info({ product, quantity }, 'Processing order')
  // BAD:  request.log.info(`Processing order for ${product} x${quantity}`)
  request.log.info(
    { product: body?.product, quantity: body?.quantity },
    'Processing order',
  );

  return { success: true, orderId: crypto.randomUUID().slice(0, 8) };
});

// ============================================
// Bootstrap & Demo
// ============================================

async function main() {
  await app.listen({ port: 3000, host: '0.0.0.0' });

  // app.log is the root logger (not request-scoped)
  app.log.info('Pino Logging Example running on http://localhost:3000');
  app.log.info('Watch the structured JSON logs below\n');

  const base = 'http://localhost:3000';

  // Trigger various routes to generate log output
  await fetch(`${base}/health`);
  await fetch(`${base}/users/123`);
  await fetch(`${base}/users/unknown`);
  await fetch(`${base}/users/error`);
  await fetch(`${base}/log-levels`);
  await fetch(`${base}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: 'Widget', quantity: 5 }),
  });

  // Request with custom correlation ID
  await fetch(`${base}/users/42`, {
    headers: { 'x-correlation-id': 'frontend-abc-123' },
  });

  console.log('\n--- Check the colored log output above ---');
  console.log('Notice how each log line includes:');
  console.log('  - reqId (auto-generated per request)');
  console.log('  - correlationId (from header or auto-generated)');
  console.log('  - Structured data objects (userId, statusCode, etc.)');
  console.log('  - Service context in child loggers\n');

  await app.close();
}

main();
