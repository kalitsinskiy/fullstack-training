// Entry point — assembles the app and starts listening.
// All routes and plugins live in app.ts, plugins/, and routes/.
import { buildApp } from './app';
import { connectDb } from './db';

const start = async () => {
  const app = await buildApp();
  try {
    await connectDb();
    app.log.info('MongoDB connected');
    await app.listen({ port: 3002, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
