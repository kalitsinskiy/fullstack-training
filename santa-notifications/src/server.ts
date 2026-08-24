import 'dotenv/config'; // load .env into process.env (same as santa-api/main.ts)
import { buildApp } from './app';
import { connectDb } from './db';
import { createSocketServer } from './socket';
import { setIo } from './io-instance';

const app = buildApp();

async function start() {
  try {
    const io = await createSocketServer(app.server, (token) => app.jwt.verify(token), app.log);
    setIo(io);
    app.log.info('Socket.IO server ready');

    await app.ready();
    await connectDb(app.config.mongoUrl);
    app.log.info('Connected to MongoDB');
    await app.listen({ port: app.config.port, host: '0.0.0.0' });
    app.log.info({ port: app.config.port }, 'santa-notifications listening');
  } catch (error) {
    app.log.error(error, 'Failed to start santa-notifications');
    process.exit(1);
  }
}

void start();
