import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

export async function startInMemoryMongo(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  return mongoServer.getUri();
}

export async function stopInMemoryMongo(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function clearAllCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
