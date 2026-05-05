/* eslint-disable @typescript-eslint/no-unused-vars */
export {};
// ============================================
// Exercise: Mongoose CRUD with a Repository
// ============================================
// Run from santa-notifications/:  npx ts-node --transpile-only exercises/07-mongodb-and-mongoose/crud-exercise.ts
// Requires: MongoDB 7.x running on localhost:27017
//
// Practice the full CRUD lifecycle for a "Book" model, plus the repository
// pattern. The schema is given. Implement the repository methods, then run
// the test scenario at the bottom.

import mongoose, { Schema, model, Types, FilterQuery } from 'mongoose';

// --- Pre-built schema (do not modify) ---

interface IBook {
  _id: Types.ObjectId;
  title: string;
  author: string;
  isbn: string;
  genre: 'fiction' | 'non-fiction' | 'sci-fi' | 'biography' | 'tech';
  pages: number;
  publishedYear: number;
  inStock: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 300 },
    author: { type: String, required: true },
    isbn: { type: String, required: true, unique: true, match: /^\d{10}(\d{3})?$/ },
    genre: { type: String, enum: ['fiction', 'non-fiction', 'sci-fi', 'biography', 'tech'], required: true },
    pages: { type: Number, required: true, min: 1 },
    publishedYear: { type: Number, required: true, min: 1000, max: new Date().getFullYear() },
    inStock: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

bookSchema.index({ author: 1, publishedYear: -1 });
bookSchema.index({ title: 'text', author: 'text' });

const Book = model<IBook>('Book', bookSchema);

// ============================================
// TODO: Implement the BookRepository class
// ============================================
//
// The repository wraps Mongoose calls so the rest of the app doesn't need
// to know about Mongoose. Each method must:
//   - Be async and return a typed Promise
//   - Throw nothing on "not found" — return null instead (callers decide)
//   - Use the modern `{ returnDocument: 'after' }` for updates (not `{ new: true }`)
//
// Required methods:
//
//   create(data): Promise<IBook>
//     Insert a new book.
//
//   findById(id): Promise<IBook | null>
//     Return the book or null.
//
//   findByIsbn(isbn): Promise<IBook | null>
//     Lookup by exact ISBN.
//
//   list(filter, options): Promise<{ items: IBook[]; total: number }>
//     filter: optional FilterQuery (e.g., { genre: 'sci-fi', inStock: true })
//     options: { page?: number; limit?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }
//     Return paginated results AND total count for that filter.
//     Defaults: page=1, limit=20, sortBy='createdAt', sortDir='desc'.
//
//   updateById(id, patch): Promise<IBook | null>
//     Apply a partial update. Run validators. Return the updated doc.
//
//   addTag(id, tag): Promise<IBook | null>
//     Use `$addToSet` so duplicates are ignored.
//
//   removeTag(id, tag): Promise<IBook | null>
//     Use `$pull`.
//
//   deleteById(id): Promise<boolean>
//     Return true if a document was deleted, false if not found.
//
//   countByGenre(): Promise<Array<{ genre: string; count: number }>>
//     Use aggregation: $group + $project + $sort by count desc.

// Your repository here:

class BookRepository {
  // TODO: implement methods listed above
}

// ============================================
// Test scenario (do not modify)
// ============================================

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/crud-exercise');
  console.log('=== Mongoose CRUD Exercise ===\n');

  const repo = new BookRepository();

  // Clean slate
  await Book.deleteMany({});

  // 1. CREATE
  console.log('--- 1. Create books ---');
  const dune = await (repo as any).create({
    title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719',
    genre: 'sci-fi', pages: 688, publishedYear: 1965, tags: ['classic'],
  });
  const foundation = await (repo as any).create({
    title: 'Foundation', author: 'Isaac Asimov', isbn: '9780553293357',
    genre: 'sci-fi', pages: 244, publishedYear: 1951, tags: ['classic'],
  });
  await (repo as any).create({
    title: 'The Pragmatic Programmer', author: 'Andy Hunt', isbn: '9780201616224',
    genre: 'tech', pages: 352, publishedYear: 1999,
  });
  await (repo as any).create({
    title: 'Steve Jobs', author: 'Walter Isaacson', isbn: '9781451648539',
    genre: 'biography', pages: 656, publishedYear: 2011, inStock: false,
  });
  console.log('Created 4 books');

  // 2. READ
  console.log('\n--- 2. Find one ---');
  console.log('By id:', (await (repo as any).findById(dune._id))?.title);
  console.log('By isbn:', (await (repo as any).findByIsbn('9780553293357'))?.title);
  console.log('Not found:', await (repo as any).findById(new Types.ObjectId()));

  // 3. LIST with pagination + filter
  console.log('\n--- 3. List ---');
  const page1 = await (repo as any).list({ genre: 'sci-fi' }, { page: 1, limit: 10, sortBy: 'publishedYear', sortDir: 'asc' });
  console.log(`sci-fi books: total=${page1.total}, items=${page1.items.map((b: IBook) => b.title).join(', ')}`);
  const inStock = await (repo as any).list({ inStock: true });
  console.log(`in-stock books: total=${inStock.total}`);

  // 4. UPDATE
  console.log('\n--- 4. Update ---');
  const updated = await (repo as any).updateById(dune._id, { pages: 700 });
  console.log(`Updated Dune pages: ${updated?.pages}`);

  // 5. ADD/REMOVE TAG
  console.log('\n--- 5. Tags ---');
  await (repo as any).addTag(dune._id, 'must-read');
  await (repo as any).addTag(dune._id, 'must-read'); // duplicate — should be ignored
  const tagged = await (repo as any).findById(dune._id);
  console.log(`Dune tags after addTag x2: [${tagged?.tags.join(', ')}]`);
  await (repo as any).removeTag(dune._id, 'classic');
  const untagged = await (repo as any).findById(dune._id);
  console.log(`Dune tags after removeTag classic: [${untagged?.tags.join(', ')}]`);

  // 6. AGGREGATION
  console.log('\n--- 6. Count by genre ---');
  const stats = await (repo as any).countByGenre();
  console.log(stats);

  // 7. DELETE
  console.log('\n--- 7. Delete ---');
  console.log(`Deleted Foundation? ${await (repo as any).deleteById(foundation._id)}`);
  console.log(`Delete missing id? ${await (repo as any).deleteById(new Types.ObjectId())}`);
  console.log(`Books left: ${(await (repo as any).list({})).total}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
