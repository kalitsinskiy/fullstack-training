import mongoose from 'mongoose';

export async function connectDb(url: string) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(url, { maxPoolSize: 10 });
}
