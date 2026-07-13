import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Jest global setup — runs ONCE before any test file is loaded.
 *
 * Why this can't live in a spec's `beforeAll`: AppModule's ConfigModule
 * validates (and snapshots) `MONGO_URL` / `JWT_SECRET` the moment the module is
 * *imported*. A spec's `beforeAll` runs far too late — the import already
 * happened. So we start the in-memory MongoDB here, before the first import, and
 * publish its URI + the test secrets on `process.env`. With `--runInBand` the
 * specs share this process, so they see these values at import time.
 */
export default async function globalSetup(): Promise<void> {
  const mongo = await MongoMemoryServer.create({
    binary: { version: '7.0.34' },
  });

  // Read back in global-teardown.ts (Jest preserves globals between the two).
  (globalThis as unknown as { __MONGO__: MongoMemoryServer }).__MONGO__ = mongo;

  process.env.MONGO_URL = mongo.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  // Keeps the throttler on in-memory storage (no Redis needed in tests).
  process.env.NODE_ENV = 'test';
}
