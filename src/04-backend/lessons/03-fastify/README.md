# Fastify

## Quick Overview

Fastify is a high-performance Node.js web framework. It is schema-based, plugin-driven, and designed for speed. The Secret Santa `santa-notifications` service uses raw Fastify.

```bash
npm install fastify
```

```typescript
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => {
  return { status: 'ok' };
});

app.listen({ port: 3000 });
```

## Key Concepts

### Why Fastify

- **Performance**: one of the fastest Node.js frameworks (uses a radix-tree router, schema-based serialization)
- **Schema validation**: built-in JSON Schema validation via Ajv (validates input AND optimizes serialization)
- **Plugin system**: everything is a plugin -- routes, database connections, auth. Clean encapsulation.
- **TypeScript support**: first-class TypeScript support with generics for request/reply typing
- **Logging**: built-in Pino logger (structured JSON logging, extremely fast)

### Basic Server with Typed Routes

```typescript
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

const app = Fastify({ logger: true });

// Type the request using generics
app.get<{
  Params: { id: string };
  Querystring: { format?: string };
}>('/users/:id', async (request, reply) => {
  const { id } = request.params;       // typed as { id: string }
  const { format } = request.query;     // typed as { format?: string }

  return { userId: id, format: format ?? 'json' };
});

// Schema validation (Fastify validates before your handler runs)
app.post<{
  Body: { name: string; email: string };
}>('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 2 },
        email: { type: 'string', format: 'email' },
      },
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
  const { name, email } = request.body;
  reply.status(201);
  return { id: 1, name, email };
});

app.listen({ port: 3000 });
```

### Plugin System

Plugins are the core building block of Fastify. Every piece of functionality -- routes, database connections, auth -- should be a plugin.

```typescript
import Fastify, { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';

// A plugin is just a function that receives the Fastify instance
async function dbPlugin(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  const db = new Map<string, unknown>(); // simulated DB

  // Decorate adds properties to the Fastify instance
  fastify.decorate('db', db);

  console.log('DB plugin loaded');
}

// fp() breaks encapsulation — makes the decorator available to sibling plugins
export default fp(dbPlugin, { name: 'db-plugin' });
```

**Key rule**: by default, plugins are **encapsulated** -- decorators and hooks registered inside a plugin are NOT visible to sibling or parent plugins. Use `fastify-plugin` (`fp`) to break encapsulation when you want to share state.

### Encapsulation

```
Root
├── Plugin A (registers decorator 'db')          ← encapsulated by default
│   └── db is available ONLY inside Plugin A
├── Plugin B
│   └── db is NOT available here
└── If Plugin A uses fp(), db becomes available to B too
```

```typescript
import Fastify from 'fastify';
import fp from 'fastify-plugin';

const app = Fastify();

// This plugin is encapsulated — 'secret' stays inside
app.register(async (instance) => {
  instance.decorate('secret', '12345');
  console.log('Inside plugin:', instance.hasDecorator('secret')); // true
});

// NOT wrapped with fp() → 'secret' is NOT available here
app.ready().then(() => {
  console.log('Outside plugin:', app.hasDecorator('secret')); // false
});
```

### Hooks (Lifecycle)

Fastify has a rich hook system for the request/reply lifecycle:

```
 Incoming Request
       │
  onRequest ──────────> preParsing ──────────> preValidation
       │                                            │
  preHandler <──────────────────────────────────────┘
       │
   Handler (your route logic)
       │
  preSerialization ──────────> onSend ──────────> onResponse
```

```typescript
import Fastify from 'fastify';

const app = Fastify({ logger: true });

// onRequest: runs first, before parsing. Good for auth checks.
app.addHook('onRequest', async (request, reply) => {
  request.log.info({ url: request.url }, 'Request started');
});

// preHandler: runs after validation, before the route handler.
app.addHook('preHandler', async (request, reply) => {
  // Check auth, load user, etc.
  const token = request.headers.authorization;
  if (request.url !== '/health' && !token) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// onSend: runs after handler, before sending the response. Can modify the payload.
app.addHook('onSend', async (request, reply, payload) => {
  // payload is the serialized body (string)
  return payload; // return modified or original payload
});

// onResponse: runs after the response is sent. Good for logging/metrics.
app.addHook('onResponse', async (request, reply) => {
  request.log.info(
    { statusCode: reply.statusCode, responseTime: reply.elapsedTime },
    'Request completed'
  );
});

// onError: runs when an error is thrown
app.addHook('onError', async (request, reply, error) => {
  request.log.error({ err: error }, 'Request errored');
});
```

### Decorators

Decorators let you attach custom properties to `fastify`, `request`, or `reply`:

```typescript
// Instance decorator (available on fastify)
fastify.decorate('config', { port: 3000, env: 'development' });
fastify.config.port; // 3000

// Request decorator (available on each request object)
fastify.decorateRequest('userId', '');  // initial value
app.addHook('preHandler', async (request) => {
  request.userId = 'user_42'; // set per request
});

// Reply decorator
fastify.decorateReply('sendSuccess', function(data: unknown) {
  this.status(200).send({ success: true, data });
});
```

### Declaration Merging (TypeScript)

When you add custom decorators, TypeScript doesn't know about them — `fastify.config` or `request.userId` will be a type error. **Declaration merging** solves this by extending Fastify's built-in interfaces with your custom properties:

```typescript
// Tell TypeScript: "FastifyInstance also has a `config` property"
declare module 'fastify' {
  interface FastifyInstance {
    config: { port: number; env: string };
  }
  interface FastifyRequest {
    userId: string;
  }
}
```

After this declaration, `fastify.config.port` and `request.userId` are properly typed everywhere — no `as any` casts needed. Place these declarations at the top of the file where the decorator is defined (usually the plugin file).

**Why not just use `as any`?** It works, but you lose type safety — a typo like `request.usrId` won't be caught. Declaration merging is the standard Fastify + TypeScript pattern.

### Register / After / Ready

```typescript
const app = Fastify();

// register() loads a plugin (async, queued)
app.register(dbPlugin);
app.register(routesPlugin);

// after() runs after the previous register completes
app.after(() => {
  console.log('All plugins above are loaded');
});

// ready() signals that the whole plugin tree is loaded
app.ready().then(() => {
  console.log('Server is ready, all plugins loaded');
});

// listen() calls ready() internally, then starts listening
app.listen({ port: 3000 });
```

### Prefix and Route Organization

```typescript
// Group routes with a prefix
app.register(async (instance) => {
  instance.get('/', async () => ({ users: [] }));        // GET /api/users
  instance.post('/', async () => ({ created: true }));   // POST /api/users
  instance.get('/:id', async () => ({ user: {} }));      // GET /api/users/:id
}, { prefix: '/api/users' });

app.register(async (instance) => {
  instance.get('/', async () => ({ rooms: [] }));        // GET /api/rooms
}, { prefix: '/api/rooms' });
```

### Error Handling

```typescript
import Fastify from 'fastify';

const app = Fastify();

// Custom error handler
app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'Unhandled error');

  // Fastify validation errors have a .validation property
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      details: error.validation,
    });
    return;
  }

  reply.status(error.statusCode ?? 500).send({
    error: error.message ?? 'Internal Server Error',
  });
});

// 404 handler
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({ error: `Route ${request.method} ${request.url} not found` });
});
```

## Learn More

- [Fastify Official Docs](https://fastify.dev/docs/latest/)
- [Fastify Plugins](https://fastify.dev/docs/latest/Reference/Plugins/)
- [Fastify Hooks](https://fastify.dev/docs/latest/Reference/Hooks/)
- [Fastify Decorators](https://fastify.dev/docs/latest/Reference/Decorators/)
- [Fastify Encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/)
- [Fastify TypeScript](https://fastify.dev/docs/latest/Reference/TypeScript/)
- [fastify-plugin (fp)](https://github.com/fastify/fastify-plugin)

### Readable Logs with pino-pretty

Fastify's built-in Pino logger outputs structured JSON — great for production, hard to read during development. Pipe through `pino-pretty` for human-friendly output:

```bash
npm install -D pino-pretty

# Pipe any Fastify server through pino-pretty:
npx ts-node src/server.ts | npx pino-pretty

# Output changes from:
#   {"level":30,"time":1234,"msg":"Server listening at http://localhost:3000"}
# To:
#   [12:34:56] INFO: Server listening at http://localhost:3000
```

> Tip: use `pino-pretty` only in development. In production, keep raw JSON for log aggregation tools (ELK, Datadog, etc.).

## How to Work

1. **Study examples** (read the code, apply patterns in the app task):
   - `examples/basic-server.ts` — typed routes, JSON Schema validation, 404 handler
   - `examples/plugins.ts` — plugin registration, `fp()`, encapsulation, decorators
   - `examples/hooks.ts` — lifecycle hooks (onRequest, preHandler, onSend, onResponse)

2. **Complete exercises**:
   ```bash
   # Bookmarks API with plugin architecture, fp(), hooks, schema validation:
   npx ts-node src/04-backend/lessons/03-fastify/exercises/plugin-server.ts
   ```
   - [exercises/app-task.md](exercises/app-task.md) — add hooks, schema validation, and error handling to `santa-notifications`
