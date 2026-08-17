import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer | undefined;

export function setupTestEnv(): void {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  process.env.SERVICE_API_KEY = process.env.SERVICE_API_KEY ?? 'test-service-key';
  process.env.RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://santa:santa123@localhost:5672';
  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
}

export async function setupTestDb(): Promise<void> {
  setupTestEnv();
  mongo = await MongoMemoryServer.create({ binary: { version: '7.0.34' } });
  process.env.MONGO_URL = mongo.getUri();
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongo.getUri());
}

export async function teardownTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
    mongo = undefined;
  }
}

export async function clearTestDb(): Promise<void> {
  const { db } = mongoose.connection;
  if (!db) return;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.collection(col.name).deleteMany({});
  }
}
