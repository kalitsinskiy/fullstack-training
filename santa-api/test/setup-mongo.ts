import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection } from 'mongoose';

let mongoServer: MongoMemoryServer;

export async function startInMemoryMongo(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  return mongoServer.getUri();
}

export async function stopInMemoryMongo(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function clearAllCollections(
  connection: Connection,
): Promise<void> {
  if (!connection) {
    console.warn('No MongoDB connection available to clear collections');
    return;
  }

  const collections = await connection.db?.collections();
  if (!collections) {
    console.warn('No collections found to clear');
    return;
  }

  for (const key of collections) {
    try {
      await key.deleteMany({});
    } catch (error) {
      // Ignore errors if collection doesn't exist
      console.error(`Error clearing collection ${key?.collectionName}:`, error);
    }
  }
}
