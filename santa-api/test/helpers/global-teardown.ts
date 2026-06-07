import { MongoMemoryServer } from 'mongodb-memory-server';

const GLOBAL_KEY = '__MONGO_MEMORY_SERVER__';

export default async function globalTeardown() {
  const mongod = (globalThis as Record<string, unknown>)[
    GLOBAL_KEY
  ] as MongoMemoryServer;
  await mongod.stop();
}
