import mongoose from 'mongoose';

export async function connectDb(
  url = process.env.MONGO_URL ?? 'mongodb://localhost:27017/santa-notifications'
) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(url, { maxPoolSize: 10 });
}
