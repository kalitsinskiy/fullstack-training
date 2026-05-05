// ============================================
// MongoDB Connection with Mongoose
// ============================================
// Run: npx ts-node src/04-backend/lessons/07-mongodb-and-mongoose/examples/connection.ts
// Requires: MongoDB 7.x running on localhost:27017

import mongoose from 'mongoose';

// --- 1. Basic connection ---
async function connectBasic(): Promise<void> {
  const uri = 'mongodb://localhost:27017/example-db';

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
}

// --- 2. Connection with options ---
// Exported to suppress unused warning — this is a reference example
export async function connectWithOptions(): Promise<void> {
  const uri = 'mongodb://localhost:27017/example-db';

  await mongoose.connect(uri, {
    maxPoolSize: 10,                    // max number of concurrent connections
    serverSelectionTimeoutMS: 5000,     // how long to try selecting a server
    socketTimeoutMS: 45000,             // how long to wait for responses
    family: 4,                          // use IPv4
  });

  console.log('Connected with options');
}

// --- 3. Connection events ---
function setupConnectionEvents(): void {
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
  });

  // Connection ready (after initial connect + all models compiled)
  mongoose.connection.once('open', () => {
    console.log('Mongoose connection is open and ready');
  });
}

// --- 4. Graceful shutdown ---
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received. Closing MongoDB connection...`);
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// --- 5. Check connection state ---
function checkConnectionState(): void {
  // mongoose.connection.readyState:
  // 0 = disconnected
  // 1 = connected
  // 2 = connecting
  // 3 = disconnecting
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = mongoose.connection.readyState;
  console.log(`Connection state: ${states[state]} (${state})`);
}

// --- Run ---
async function main(): Promise<void> {
  console.log('=== MongoDB Connection Examples ===\n');

  setupConnectionEvents();
  setupGracefulShutdown();

  checkConnectionState(); // disconnected

  await connectBasic();

  checkConnectionState(); // connected

  // Get database info
  const db = mongoose.connection.db;
  if (db) {
    const admin = db.admin();
    const info = await admin.serverInfo();
    console.log(`MongoDB version: ${info.version}`);
  }

  // List collections
  if (db) {
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map((c) => c.name));
  }

  // Disconnect
  await mongoose.disconnect();
  console.log('\nDisconnected. Done.');
}

main().catch(console.error);
