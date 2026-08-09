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
  // mongodb-memory-server enforces a hard 10s launch timeout by default. The
  // bundled mongod 8.x is heavy and its cold start competes with ts-jest
  // compilation on the first e2e run, occasionally tipping past 10s and failing
  // with "Instance failed to start within 10000ms". Give it generous headroom.
  const mongo = await MongoMemoryServer.create({
    instance: { launchTimeout: 60_000 },
  });

  // Read back in global-teardown.ts (Jest preserves globals between the two).
  (globalThis as unknown as { __MONGO__: MongoMemoryServer }).__MONGO__ = mongo;

  process.env.MONGO_URL = mongo.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  process.env.NODE_ENV = 'test';
}
