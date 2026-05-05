export {};
// ============================================
// Mongoose CRUD Operations
// ============================================
// Run: npx ts-node src/04-backend/lessons/07-mongodb-and-mongoose/examples/crud-operations.ts
// Requires: MongoDB 7.x running on localhost:27017

import mongoose, { Schema, model } from 'mongoose';

// --- Schema setup ---

interface IProduct {
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    inStock: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, price: 1 });
productSchema.index({ name: 'text' });

const Product = model<IProduct>('Product', productSchema);

// --- Run ---

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/crud-example');
  console.log('=== CRUD Operations ===\n');

  // Clean up
  await Product.deleteMany({});

  // ==========================================
  // CREATE
  // ==========================================
  console.log('--- CREATE ---');

  // Single document
  const laptop = await Product.create({
    name: 'MacBook Pro',
    category: 'electronics',
    price: 2499,
    tags: ['apple', 'laptop', 'pro'],
  });
  console.log('Created:', laptop.name, `($${laptop.price})`);

  // Multiple documents
  const products = await Product.insertMany([
    { name: 'iPhone 15', category: 'electronics', price: 999, tags: ['apple', 'phone'] },
    { name: 'AirPods Pro', category: 'electronics', price: 249, tags: ['apple', 'audio'] },
    { name: 'Standing Desk', category: 'furniture', price: 599, tags: ['office', 'ergonomic'] },
    { name: 'Monitor Arm', category: 'furniture', price: 89, tags: ['office', 'ergonomic'] },
    { name: 'Mechanical Keyboard', category: 'electronics', price: 149, tags: ['input', 'mechanical'] },
    { name: 'Ergonomic Chair', category: 'furniture', price: 899, inStock: false, tags: ['office'] },
  ]);
  console.log(`Inserted ${products.length} products\n`);

  // ==========================================
  // READ
  // ==========================================
  console.log('--- READ ---');

  // Find all
  const all = await Product.find();
  console.log(`Total products: ${all.length}`);

  // Find with filter
  const electronics = await Product.find({ category: 'electronics' });
  console.log(`Electronics: ${electronics.length}`);

  // Find one
  const cheapest = await Product.findOne({ category: 'electronics' }).sort({ price: 1 });
  console.log(`Cheapest electronic: ${cheapest?.name} ($${cheapest?.price})`);

  // Find by ID
  const found = await Product.findById(laptop._id);
  console.log(`Found by ID: ${found?.name}`);

  // Projection — only specific fields
  const names = await Product.find({}, 'name price');
  console.log('Names and prices:', names.map((p) => `${p.name}: $${p.price}`));

  // Comparison operators
  const expensive = await Product.find({ price: { $gte: 500 } });
  console.log(`Products >= $500: ${expensive.length}`);

  const midRange = await Product.find({ price: { $gte: 100, $lte: 1000 } });
  console.log(`Products $100-$1000: ${midRange.length}`);

  // Logical operators
  const cheapElectronics = await Product.find({
    $and: [{ category: 'electronics' }, { price: { $lt: 300 } }],
  });
  console.log(`Cheap electronics (< $300): ${cheapElectronics.length}`);

  // Array operators
  const appleProducts = await Product.find({ tags: 'apple' }); // contains 'apple'
  console.log(`Apple products: ${appleProducts.length}`);

  const officeErgonomic = await Product.find({ tags: { $all: ['office', 'ergonomic'] } });
  console.log(`Office + ergonomic: ${officeErgonomic.length}`);

  // Sorting
  const sorted = await Product.find().sort({ price: -1 }).limit(3);
  console.log('Top 3 expensive:', sorted.map((p) => `${p.name} ($${p.price})`));

  // Pagination (skip + limit)
  const page2 = await Product.find()
    .sort({ name: 1 })
    .skip(3)    // skip first 3
    .limit(3);  // take next 3
  console.log('Page 2 (3 items):', page2.map((p) => p.name));

  // Count
  const count = await Product.countDocuments({ category: 'electronics' });
  console.log(`Electronics count: ${count}`);

  // Exists check
  const exists = await Product.exists({ name: 'MacBook Pro' });
  console.log(`MacBook Pro exists: ${!!exists}\n`);

  // ==========================================
  // UPDATE
  // ==========================================
  console.log('--- UPDATE ---');

  // findByIdAndUpdate — returns the updated document.
  // In Mongoose 9+, prefer `returnDocument: 'after'` over the legacy `{ new: true }`
  // option (which still works but emits a deprecation warning).
  const updated = await Product.findByIdAndUpdate(
    laptop._id,
    { price: 2299, $push: { tags: 'discount' } },
    { returnDocument: 'after', runValidators: true },
  );
  console.log(`Updated: ${updated?.name} - new price: $${updated?.price}, tags: ${updated?.tags}`);

  // updateOne
  await Product.updateOne(
    { name: 'iPhone 15' },
    { $set: { price: 899 } },
  );
  console.log('iPhone price updated to $899');

  // updateMany
  const bulkResult = await Product.updateMany(
    { category: 'furniture' },
    { $set: { inStock: true } },
  );
  console.log(`Bulk update: ${bulkResult.modifiedCount} furniture items set to inStock`);

  // $inc — increment a field
  await Product.updateOne(
    { name: 'MacBook Pro' },
    { $inc: { price: -100 } },  // decrease by 100
  );

  // $pull — remove from array
  await Product.updateOne(
    { name: 'MacBook Pro' },
    { $pull: { tags: 'discount' } },
  );
  console.log('Removed discount tag from MacBook\n');

  // ==========================================
  // DELETE
  // ==========================================
  console.log('--- DELETE ---');

  // Delete one
  const deleted = await Product.findByIdAndDelete(laptop._id);
  console.log(`Deleted: ${deleted?.name}`);

  // deleteMany
  const deleteResult = await Product.deleteMany({ category: 'furniture' });
  console.log(`Deleted ${deleteResult.deletedCount} furniture items`);

  // Final count
  const remaining = await Product.countDocuments();
  console.log(`Remaining products: ${remaining}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
