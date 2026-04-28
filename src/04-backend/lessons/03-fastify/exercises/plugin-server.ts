export {};
// ============================================
// FASTIFY PLUGIN ARCHITECTURE Exercise
// ============================================
// Run: npx ts-node src/04-backend/lessons/03-fastify/exercises/plugin-server.ts
//
// Build a Bookmarks API using Fastify's plugin system.
// This exercise practices: plugins, fp(), decorators, hooks, encapsulation, JSON Schema.

import Fastify, { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';

// --- Data model ---
interface Bookmark {
  id: number;
  url: string;
  title: string;
  tags: string[];
  createdAt: string;
}

// TODO 1: Declaration merging
//
// Tell TypeScript about the custom properties you'll add to FastifyInstance and FastifyRequest.
// Without this, accessing `fastify.store` or `request.startTime` will be a TypeScript error.
//
// declare module 'fastify' {
//   interface FastifyInstance {
//     store: { bookmarks: Bookmark[]; nextId: number };
//     appConfig: { port: number; env: string };
//   }
//   interface FastifyRequest {
//     startTime: number;
//   }
// }

// TODO 2: Config plugin (wrap with fp)
//
// Create a plugin that decorates the Fastify instance with an `appConfig` object:
//   { port: 3000, env: process.env.NODE_ENV ?? 'development' }
//
// async function configPlugin(fastify: FastifyInstance) {
//   fastify.decorate('appConfig', { ... });
// }
// export const configPluginWrapped = fp(configPlugin, { name: 'config' });

// TODO 3: Database plugin (wrap with fp)
//
// Create a plugin that decorates the Fastify instance with a `store` object:
//   { bookmarks: [], nextId: 1 }
//
// async function dbPlugin(fastify: FastifyInstance) {
//   fastify.decorate('store', { ... });
// }
// export const dbPluginWrapped = fp(dbPlugin, { name: 'db' });

// TODO 4: Timing plugin (wrap with fp)
//
// Create a plugin with two hooks:
//   - onRequest: store Date.now() in request.startTime (use decorateRequest)
//   - onSend: add X-Response-Time header with elapsed ms
//
// async function timingPlugin(fastify: FastifyInstance) {
//   fastify.decorateRequest('startTime', 0);
//   fastify.addHook('onRequest', async (request) => { ... });
//   fastify.addHook('onSend', async (request, reply) => { ... });
// }
// export const timingPluginWrapped = fp(timingPlugin, { name: 'timing' });

// TODO 5: Request counter plugin (DO NOT wrap with fp — test encapsulation)
//
// This plugin tracks how many requests it has seen, but because it's NOT
// wrapped with fp(), the counter is encapsulated — invisible to other plugins.
//
// Let it also register a GET /stats route that returns { requestCount: N }.
//
// NOTE: Because the hook is encapsulated, it only counts requests to routes
// registered INSIDE this plugin (i.e., /stats). Routes from other plugins
// (like /api/bookmarks) won't increment the counter. This is encapsulation
// in action — try it and observe the count!
//
// async function statsPlugin(fastify: FastifyInstance) {
//   let count = 0;
//   fastify.addHook('onRequest', async () => { count++; });
//   fastify.get('/stats', async () => ({ requestCount: count }));
// }

// TODO 6: Bookmark routes plugin (DO NOT wrap with fp — routes stay encapsulated)
//
// Register with prefix '/api/bookmarks'. Endpoints:
//
// GET /              — return all bookmarks. Support ?tag=<tag> filter.
// GET /:id           — return bookmark by id, or 404
// POST /             — create bookmark with JSON Schema validation:
//                      body: { url: string (format: 'uri'), title: string (minLength: 1), tags: string[] }
//                      → 201 with created bookmark
// DELETE /:id        — delete bookmark, 204 or 404
//
// Access the store via fastify.store (available because dbPlugin uses fp).
//
// async function bookmarkRoutes(fastify: FastifyInstance) {
//   const { store } = fastify;
//   ...
// }

// TODO 7: Assemble and start
//
// const app = Fastify({ logger: true });
//
// Register plugins in order:
//   1. configPluginWrapped
//   2. dbPluginWrapped
//   3. timingPluginWrapped
//   4. statsPlugin          (encapsulated)
//   5. bookmarkRoutes       (with prefix: '/api/bookmarks')
//   6. A GET /health route  (inline or separate plugin)
//
// After ready, log encapsulation check:
//   app.ready().then(() => {
//     console.log('Has store?', app.hasDecorator('store'));           // true
//     console.log('Has appConfig?', app.hasDecorator('appConfig'));   // true
//   });
//
// Listen on port 3000.
//
// Test with:
//   curl http://localhost:3000/health
//   curl http://localhost:3000/stats
//   curl -X POST http://localhost:3000/api/bookmarks \
//     -H "Content-Type: application/json" \
//     -d '{"url":"https://fastify.dev","title":"Fastify Docs","tags":["docs","node"]}'
//   curl http://localhost:3000/api/bookmarks
//   curl http://localhost:3000/api/bookmarks?tag=docs
//   curl -X DELETE http://localhost:3000/api/bookmarks/1 -w "\nHTTP %{http_code}\n"
//   # Check timing header:
//   curl -v http://localhost:3000/health 2>&1 | grep x-response-time

// Your code here:
interface DbStore {
  bookmarks: Bookmark[];
  nextId: number;
}

interface AppConfig {
  port: number;
  env: string;
  appName: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    appDb: DbStore;
    appConfig: AppConfig;
  }

  interface FastifyRequest {
    startTime: number;
  }
}

async function dbPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const appDb: DbStore = { bookmarks: [], nextId: 1 };

  fastify.decorate('appDb', appDb);
  fastify.log.info({ appDb }, 'Store plugin loaded');
}

const dbluginWrapped = fp(dbPlugin, { name: 'store-plugin' });

async function configPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const appConfig: AppConfig = {
    port: 3000,
    env: process.env.NODE_ENV ?? 'development',
    appName: 'fastify-excercise',
  };

  fastify.decorate('appConfig', appConfig);
  fastify.log.info({ appConfig }, 'Config plugin loaded');
}

const configPluginWrapped = fp(configPlugin, { name: 'config' });

async function timingPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('startTime', 0);

  fastify.addHook('onRequest', async (request) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Response-Time', String(Date.now() - request.startTime) + 'ms');
  });
}

const timingPluginWrapped = fp(timingPlugin, { name: 'timing' });

async function statsPlugin(fastify: FastifyInstance) {
  let count = 0;
  fastify.addHook('onRequest', async () => {
    count++;
  });

  fastify.get('/stats', async () => ({ requestCount: count }));
}

async function bookmarkRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const appDb = fastify.appDb;

  fastify.get('/', async () => {
    return { bookmarks: appDb.bookmarks };
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const bookmark = appDb.bookmarks.find((b) => b.id === id);

    if (!bookmark) {
      reply.status(404);
      return { error: 'Bookmark not found' };
    }

    return bookmark;
  });

  fastify.post<{ Body: { url: string; title: string; tags: string[] } }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['title', 'url', 'tags'],
          properties: {
            title: { type: 'string', minLength: 1 },
            url: { type: 'string', format: 'uri' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              url: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { title, url, tags } = request.body;
      const bookmark: Bookmark = {
        id: appDb.nextId++,
        title,
        url,
        tags,
        createdAt: new Date().toISOString(),
      };

      appDb.bookmarks.push(bookmark);
      reply.status(201);

      return bookmark;
    }
  );

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const bookmark = appDb.bookmarks.find((b) => b.id === id);

    if (!bookmark) {
      reply.status(404);
      return { error: 'Bookmark not found' };
    }

    const index = appDb.bookmarks.indexOf(bookmark);

    appDb.bookmarks.splice(index, 1);

    return reply.status(204).send();
  });
}

const app = Fastify({ logger: true });

app.register(configPluginWrapped);
app.register(dbluginWrapped);
app.register(timingPluginWrapped);
app.register(statsPlugin);
app.register(bookmarkRoutes, { prefix: '/api/bookmarks' });
app.register(async (instance) => {
  instance.get('/health', async () => ({
    status: 'ok',
    env: instance.appConfig.env,
    uptime: process.uptime(),
    bookmarks: instance.appDb.bookmarks.length,
  }));
});

app.listen({ port: 3000 }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
