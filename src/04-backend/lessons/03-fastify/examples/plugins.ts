export {};
// ============================================
// FASTIFY PLUGINS Example
// ============================================
// Run this file with: npx ts-node src/04-backend/lessons/03-fastify/examples/plugins.ts
//
// Test with:
//   curl http://localhost:3000/health
//   curl http://localhost:3000/api/items
//   curl -X POST http://localhost:3000/api/items -H "Content-Type: application/json" -d '{"name":"Book"}'

import Fastify, { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';

// -------------------------------------------------------
// Type declarations — tell TypeScript about our custom decorators
// -------------------------------------------------------
// This is "declaration merging": we extend Fastify's built-in
// FastifyInstance interface with our own properties. After this,
// fastify.db and fastify.config are properly typed everywhere.

interface DbStore {
  items: Array<{ id: number; name: string }>;
  nextId: number;
}

interface AppConfig {
  env: string;
  appName: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: DbStore;
    config: AppConfig;
  }
}

async function dbPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const store: DbStore = { items: [], nextId: 1 };

  // Decorate the Fastify instance with our "db"
  fastify.decorate('db', store);

  fastify.log.info('DB plugin loaded (in-memory store)');
}

// fp() breaks encapsulation — fastify.db will be accessible everywhere
const dbPluginWrapped = fp(dbPlugin, { name: 'db-plugin' });

// -------------------------------------------------------
// 2. Config plugin (shared via fp)
// -------------------------------------------------------
async function configPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const config: AppConfig = {
    env: process.env.NODE_ENV ?? 'development',
    appName: 'plugins-demo',
  };

  fastify.decorate('config', config);
  fastify.log.info({ config }, 'Config plugin loaded');
}

const configPluginWrapped = fp(configPlugin, { name: 'config-plugin' });

// -------------------------------------------------------
// 3. Routes plugin (encapsulated by default — that's fine for routes)
// -------------------------------------------------------
async function itemRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // fastify.db is available because dbPlugin used fp()
  // Thanks to declaration merging above, this is properly typed — no "as any" needed.
  const { db } = fastify;

  fastify.get('/', async () => {
    return { items: db.items };
  });

  fastify.post<{ Body: { name: string } }>('/', async (request, reply) => {
    const { name } = request.body;
    const item = { id: db.nextId++, name };
    db.items.push(item);
    reply.status(201);
    return item;
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const item = db.items.find((i) => i.id === id);
    if (!item) {
      reply.status(404);
      return { error: 'Item not found' };
    }
    return item;
  });

  fastify.log.info('Item routes registered at /api/items');
}

// -------------------------------------------------------
// 4. Health routes plugin
// -------------------------------------------------------
async function healthRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const { config } = fastify;

  fastify.get('/health', async () => {
    return {
      status: 'ok',
      app: config.appName,
      env: config.env,
      timestamp: new Date().toISOString(),
    };
  });
}

// -------------------------------------------------------
// 5. Assemble the application
// -------------------------------------------------------
const app = Fastify({ logger: true });

// Register plugins in order — Fastify loads them sequentially
app.register(configPluginWrapped);    // shared config
app.register(dbPluginWrapped);        // shared db

// After shared plugins are loaded, register routes
app.register(healthRoutes);                              // /health
app.register(itemRoutes, { prefix: '/api/items' });      // /api/items

// -------------------------------------------------------
// 6. Demonstrate encapsulation
// -------------------------------------------------------
app.register(async (instance) => {
  // This decorator is encapsulated — only visible inside this plugin
  instance.decorate('secret', 'my-secret-value');
  instance.log.info('Encapsulated plugin loaded, secret available here');

  instance.get('/encapsulated', async () => {
    return { hasSecret: instance.hasDecorator('secret') }; // true
  });
});

// After all plugins load, check what's available at the root level
app.ready().then(() => {
  console.log('\n--- Encapsulation check ---');
  console.log('Root has db?', app.hasDecorator('db'));           // true (used fp)
  console.log('Root has config?', app.hasDecorator('config'));   // true (used fp)
  console.log('Root has secret?', app.hasDecorator('secret'));   // false (encapsulated)
});

// -------------------------------------------------------
// Start
// -------------------------------------------------------
app.listen({ port: 3000 }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
