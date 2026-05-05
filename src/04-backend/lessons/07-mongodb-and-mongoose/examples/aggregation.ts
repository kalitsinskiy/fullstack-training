export {};
// ============================================
// MongoDB Aggregation Pipeline
// ============================================
// Run: npx ts-node src/04-backend/lessons/07-mongodb-and-mongoose/examples/aggregation.ts
// Requires: MongoDB 7.x running on localhost:27017

import mongoose, { Schema, model, Types } from 'mongoose';

// --- Schemas ---

interface IAuthor {
  name: string;
  country: string;
}

interface IArticle {
  title: string;
  authorId: Types.ObjectId;
  category: string;
  views: number;
  rating: number;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  tags: string[];
  createdAt: Date;
}

const authorSchema = new Schema<IAuthor>({
  name: { type: String, required: true },
  country: { type: String, required: true },
});

const articleSchema = new Schema<IArticle>({
  title: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'Author', required: true },
  category: { type: String, required: true },
  views: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});

const Author = model<IAuthor>('Author', authorSchema);
const Article = model<IArticle>('Article', articleSchema);

// --- Seed data ---

async function seedData(): Promise<void> {
  await Author.deleteMany({});
  await Article.deleteMany({});

  const authors = await Author.insertMany([
    { name: 'Alice Johnson', country: 'US' },
    { name: 'Bob Williams', country: 'UK' },
    { name: 'Carol Davis', country: 'US' },
  ]);

  const alice = authors[0]!;
  const bob = authors[1]!;
  const carol = authors[2]!;

  await Article.insertMany([
    { title: 'Intro to MongoDB', authorId: alice._id, category: 'database', views: 1500, rating: 4.5, status: 'published', publishedAt: new Date('2025-01-15'), tags: ['mongodb', 'nosql'] },
    { title: 'Advanced Mongoose', authorId: alice._id, category: 'database', views: 980, rating: 4.8, status: 'published', publishedAt: new Date('2025-02-20'), tags: ['mongoose', 'mongodb'] },
    { title: 'REST API Design', authorId: bob._id, category: 'api', views: 2200, rating: 4.2, status: 'published', publishedAt: new Date('2025-01-10'), tags: ['rest', 'api'] },
    { title: 'GraphQL Basics', authorId: bob._id, category: 'api', views: 1800, rating: 3.9, status: 'published', publishedAt: new Date('2025-03-05'), tags: ['graphql', 'api'] },
    { title: 'Testing with Jest', authorId: carol._id, category: 'testing', views: 3100, rating: 4.7, status: 'published', publishedAt: new Date('2025-02-01'), tags: ['jest', 'testing'] },
    { title: 'NestJS Deep Dive', authorId: carol._id, category: 'framework', views: 750, rating: 4.1, status: 'published', publishedAt: new Date('2025-03-15'), tags: ['nestjs', 'typescript'] },
    { title: 'Docker for Devs', authorId: alice._id, category: 'devops', views: 500, rating: 3.5, status: 'draft', tags: ['docker', 'devops'] },
    { title: 'CI/CD Pipelines', authorId: bob._id, category: 'devops', views: 0, rating: 0, status: 'draft', tags: ['ci-cd', 'devops'] },
  ]);
}

// --- Aggregation examples ---

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/aggregation-example');
  console.log('=== Aggregation Pipeline Examples ===\n');

  await seedData();

  // --- 1. $match + $group: Count articles per category ---
  console.log('--- 1. Articles per category ---');
  const perCategory = await Article.aggregate([
    { $match: { status: 'published' } },
    { $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgRating: { $avg: '$rating' },
      }},
    { $sort: { count: -1 } },
  ]);
  console.log(perCategory);

  // --- 2. $group + $sort: Most viewed articles ---
  console.log('\n--- 2. Top 3 most viewed (published) ---');
  const topViewed = await Article.aggregate([
    { $match: { status: 'published' } },
    { $sort: { views: -1 } },
    { $limit: 3 },
    { $project: { title: 1, views: 1, rating: 1, _id: 0 } },
  ]);
  console.log(topViewed);

  // --- 3. $lookup: Join articles with authors ---
  console.log('\n--- 3. Articles with author info ($lookup) ---');
  const withAuthors = await Article.aggregate([
    { $match: { status: 'published' } },
    { $lookup: {
        from: 'authors',         // collection name (lowercase, plural)
        localField: 'authorId',
        foreignField: '_id',
        as: 'author',
      }},
    { $unwind: '$author' },       // flatten the array to a single object
    { $project: {
        title: 1,
        authorName: '$author.name',
        authorCountry: '$author.country',
        views: 1,
        _id: 0,
      }},
    { $sort: { views: -1 } },
  ]);
  console.log(withAuthors);

  // --- 4. $group: Author statistics ---
  console.log('\n--- 4. Author statistics ---');
  const authorStats = await Article.aggregate([
    { $match: { status: 'published' } },
    { $group: {
        _id: '$authorId',
        articleCount: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgRating: { $avg: '$rating' },
        categories: { $addToSet: '$category' },
      }},
    { $lookup: {
        from: 'authors',
        localField: '_id',
        foreignField: '_id',
        as: 'author',
      }},
    { $unwind: '$author' },
    { $project: {
        _id: 0,
        authorName: '$author.name',
        articleCount: 1,
        totalViews: 1,
        avgRating: { $round: ['$avgRating', 1] },
        categories: 1,
      }},
    { $sort: { totalViews: -1 } },
  ]);
  console.log(authorStats);

  // --- 5. $unwind: Flatten tags and count ---
  console.log('\n--- 5. Most used tags ---');
  const tagCounts = await Article.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    { $group: {
        _id: '$tags',
        count: { $sum: 1 },
      }},
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  console.log(tagCounts);

  // --- 6. $bucket: Group by view ranges ---
  console.log('\n--- 6. Articles by view range ---');
  const viewBuckets = await Article.aggregate([
    { $match: { status: 'published' } },
    { $bucket: {
        groupBy: '$views',
        boundaries: [0, 500, 1000, 2000, 5000],
        default: '5000+',
        output: {
          count: { $sum: 1 },
          titles: { $push: '$title' },
        },
      }},
  ]);
  console.log(viewBuckets);

  // --- 7. $addFields + $cond: Computed fields ---
  console.log('\n--- 7. Articles with popularity label ---');
  const withPopularity = await Article.aggregate([
    { $match: { status: 'published' } },
    { $addFields: {
        popularity: {
          $cond: {
            if: { $gte: ['$views', 2000] },
            then: 'high',
            else: {
              $cond: {
                if: { $gte: ['$views', 1000] },
                then: 'medium',
                else: 'low',
              },
            },
          },
        },
      }},
    { $project: { title: 1, views: 1, popularity: 1, _id: 0 } },
    { $sort: { views: -1 } },
  ]);
  console.log(withPopularity);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
