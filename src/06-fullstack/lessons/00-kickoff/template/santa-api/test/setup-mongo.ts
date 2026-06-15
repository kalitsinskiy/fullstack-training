import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection } from 'mongoose';

jest.setTimeout(120_000);

let mongoServer: MongoMemoryServer | undefined;

export async function startInMemoryMongo(): Promise<string> {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '7.0.34' },
  });
  return mongoServer.getUri();
}

export async function stopInMemoryMongo(): Promise<void> {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = undefined;
  }
}

export async function clearAllCollections(
  connection: Connection,
): Promise<void> {
  const db = connection.db;
  if (!db) return;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.collection(col.name).deleteMany({});
  }
}
