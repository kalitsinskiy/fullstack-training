import 'dotenv/config'; // load .env into process.env (same as santa-api/main.ts)
import { buildApp } from './app';
import { connectDb } from './db';
import { startConsumer } from './consumer';
import { initSantaApiClient } from './services/santa-api-client';

const app = buildApp();

async function start() {
  try {
    await app.ready();
    await connectDb(app.config.mongoUrl);
    app.log.info('Connected to MongoDB');
    initSantaApiClient(app.config.santaApiUrl, app.config.serviceApiKey);
    await startConsumer(app.config.rabbitmqUrl, (msg) => app.log.info(msg));
    await app.listen({ port: app.config.port, host: '0.0.0.0' });
    app.log.info({ port: app.config.port }, 'santa-notifications listening');
  } catch (error) {
    app.log.error(error, 'Failed to start santa-notifications');
    process.exit(1);
  }
}

void start();
