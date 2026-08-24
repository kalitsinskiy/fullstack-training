import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer | undefined;

/** Start an in-memory MongoDB and connect mongoose to it. Call in beforeAll. */
export async function setupTestDb(): Promise<void> {
  // Pin the binary version so it's shared with santa-api's test cache.
  // mongodb-memory-server enforces a hard 10s launch timeout by default; a cold
  // mongod start competing with ts-jest compilation can tip past it and fail
  // with "Instance failed to start within 10000ms". Give it generous headroom,
  // matching santa-api's global-setup.
  mongo = await MongoMemoryServer.create({
    binary: { version: '7.0.34' },
    instance: { launchTimeout: 60_000 },
  });
  // Expose the URI before buildApp() so the config plugin finds MONGO_URL.
  process.env.MONGO_URL = mongo.getUri();
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongo.getUri());
}

/** Disconnect and stop the in-memory MongoDB. Call in afterAll. */
export async function teardownTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
    mongo = undefined;
  }
}

/** Wipe every collection so each test starts clean. Call in beforeEach. */
export async function clearTestDb(): Promise<void> {
  const { db } = mongoose.connection;
  if (!db) return;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.collection(col.name).deleteMany({});
  }
}
