import mongoose, { Connection } from 'mongoose';

jest.setTimeout(120_000);

/**
 * The in-memory MongoDB is started once for the whole run in global-setup.ts —
 * it has to exist *before* AppModule is imported, because ConfigModule validates
 * and snapshots MONGO_URL at import time. These helpers just hand the specs the
 * URI that global-setup already published, so the existing `beforeAll` wiring
 * keeps working unchanged.
 */
export function startInMemoryMongo(): Promise<string> {
  return Promise.resolve(process.env.MONGO_URL as string);
}

export async function stopInMemoryMongo(): Promise<void> {
  // The shared server is stopped in global-teardown.ts; here we just drop the
  // mongoose connection this suite opened.
  await mongoose.disconnect();
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
