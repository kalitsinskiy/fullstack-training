import mongoose from 'mongoose';

// URI comes from fastify.config.mongoUrl (validated by the config plugin),
// not directly from process.env — config is read and validated in one place.
export async function connectDb(url: string) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(url, { maxPoolSize: 10 });
}
