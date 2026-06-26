import { MongoMemoryServer } from 'mongodb-memory-server';

/** Stops the in-memory MongoDB started in global-setup.ts. */
export default async function globalTeardown(): Promise<void> {
  const mongo = (globalThis as unknown as { __MONGO__?: MongoMemoryServer })
    .__MONGO__;
  if (mongo) {
    await mongo.stop();
  }
}
