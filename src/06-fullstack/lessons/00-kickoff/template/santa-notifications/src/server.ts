import { buildApp } from './app';
import { connectDb } from './db';

const app = buildApp();

async function start() {
  try {
    await connectDb();
    app.log.info('Connected to MongoDB');
    await app.ready();
    await app.listen({ port: app.config.port, host: '0.0.0.0' });
    app.log.info({ port: app.config.port }, 'santa-notifications listening');
  } catch (error) {
    app.log.error(error, 'Failed to start santa-notifications');
    process.exit(1);
  }
}

void start();
