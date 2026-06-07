import { MongoMemoryServer } from 'mongodb-memory-server';

const GLOBAL_KEY = '__MONGO_MEMORY_SERVER__';

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URL = mongod.getUri();
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = mongod;
}
