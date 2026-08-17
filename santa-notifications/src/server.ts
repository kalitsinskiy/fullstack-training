import 'dotenv/config'; // load .env into process.env (same as santa-api/main.ts)
import { buildApp } from './app';
import { connectDb } from './db';
import { startConsumer } from './consumer';
import { initSantaApiClient } from './services/santa-api-client';
import { createSocketServer } from './socket';
import { setIO } from './realtime';
import { initPublisher } from './services/publisher';

const app = buildApp();

async function start() {
  try {
    await app.ready();
    await connectDb(app.config.mongoUrl);
    app.log.info('Connected to MongoDB');
    initSantaApiClient(app.config.santaApiUrl, app.config.serviceApiKey);
    await app.listen({ port: app.config.port, host: '0.0.0.0' });
    app.log.info({ port: app.config.port }, 'santa-notifications listening');

    const corsOrigin = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:5173'];

    const io = await createSocketServer(app.server, app.redis, {
      corsOrigin,
      jwtSecret: app.config.jwtSecret,
    });

    setIO(io);
    await initPublisher(app.config.rabbitmqUrl);
    await startConsumer(app.config.rabbitmqUrl, io, (msg) => app.log.info(msg));
  } catch (error) {
    app.log.error(error, 'Failed to start santa-notifications');
    process.exit(1);
  }
}

void start();
