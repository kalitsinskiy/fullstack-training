import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer | undefined;

/** Start an in-memory MongoDB and connect mongoose to it. Call in beforeAll. */
export async function setupTestDb(): Promise<void> {
  // Pin the binary version so it's shared with santa-api's test cache.
  mongo = await MongoMemoryServer.create({ binary: { version: '7.0.34' } });
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
