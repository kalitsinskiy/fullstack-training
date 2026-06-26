import { buildApp } from './app';
import { connectDb } from './db';
import { startEventConsumer } from './events-consumer';
import { SantaApiClient } from './services/santa-api-client';
import { createSocketServer } from './socket';
import { setIO } from './realtime';

const app = buildApp();

async function start() {
  try {
    // Build the plugin tree first so fastify.config is populated (and validated)
    // before we use it to connect.
    await app.ready();
    await connectDb(app.config.mongoUrl);
    app.log.info('Connected to MongoDB');

    // Listen first so Socket.IO can attach to Fastify's underlying HTTP server.
    await app.listen({ port: app.config.port, host: '0.0.0.0' });

    const apiClient = new SantaApiClient(
      app.config.santaApiUrl,
      app.config.serviceApiKey,
    );

    const io = createSocketServer(app.server, {
      jwtSecret: app.config.jwtSecret,
      redisUrl: app.config.redisUrl,
      corsOrigin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : ['http://localhost:5173'],
      api: apiClient,
      log: app.log,
    });
    // Expose io to request handlers (POST /messages pushes live).
    setIO(io);

    // Consumer pushes each created notification through Socket.IO.
    await startEventConsumer(app.config.rabbitUrl, apiClient, io, app.log);

    app.log.info({ port: app.config.port }, 'santa-notifications listening');
  } catch (error) {
    app.log.error(error, 'Failed to start santa-notifications');
    process.exit(1);
  }
}

void start();
