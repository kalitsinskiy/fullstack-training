import { buildApp } from './app';
import { connectDb } from './db';

(async () => {
  const app = await buildApp();
  const { config } = app;
  const port = config.port || 3000;

  try {
    await connectDb();
    await app.listen({ port });
    app.log.info(`Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
})();
