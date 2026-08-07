import 'dotenv/config'; // load .env into process.env (same as santa-api/main.ts)
import { buildApp } from './app';
import { connectDb } from './db';
import { createSocketServer } from './socket';
import mongoose from 'mongoose';

const app = buildApp();

async function start() {
  try {
    await app.ready();
    await connectDb(app.config.mongoUrl);
    app.log.info('Connected to MongoDB');

    app.io = createSocketServer(app);
    await app.listen({ port: app.config.port, host: '0.0.0.0' });
    app.log.info({ port: app.config.port }, 'santa-notifications listening (WebSocket ready)');
  } catch (error) {
    app.log.error(error, 'Failed to start santa-notifications');
    process.exit(1);
  }
}

let shuttingDown = false;

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;

    shuttingDown = true;

    app.log.info({ signal }, 'Shutting down');

    void (async () => {
      try {
        app.io?.close();
        await app.close();
        await mongoose.disconnect();
      } catch (err) {
        app.log.error(err, 'Graceful shutdown failed');
        process.exit(1);
      }
    })();
  });
}

void start();
