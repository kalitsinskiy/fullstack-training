/* eslint-disable @typescript-eslint/no-unused-vars */
export {};
// ============================================
// Exercise: MongoDB Queries & Aggregation
// ============================================
// Run from santa-notifications/:  npx ts-node --transpile-only exercises/07-mongodb-and-mongoose/queries.ts
// Requires: MongoDB 7.x running on localhost:27017

import mongoose, { Schema, model, Types } from 'mongoose';

// --- Pre-built schemas (do not modify) ---

interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  role: 'author' | 'editor' | 'reader';
  createdAt: Date;
}

interface IPost {
  title: string;
  authorId: Types.ObjectId;
  category: string;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  tags: string[];
  publishedAt?: Date;
  createdAt: Date;
}

interface IComment {
  postId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  likes: number;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['author', 'editor', 'reader'], default: 'reader' },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new Schema<IPost>({
  title: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  viewCount: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new Schema<IComment>({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const User = model<IUser>('User', userSchema);
const Post = model<IPost>('Post', postSchema);
const Comment = model<IComment>('Comment', commentSchema);

// --- Seed data ---

async function seedData(): Promise<void> {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});

  const users = await User.insertMany([
    { firstName: 'Alice', lastName: 'Johnson', email: 'alice@blog.com', role: 'author' },
    { firstName: 'Bob', lastName: 'Smith', email: 'bob@blog.com', role: 'author' },
    { firstName: 'Carol', lastName: 'Davis', email: 'carol@blog.com', role: 'editor' },
    { firstName: 'Dan', lastName: 'Brown', email: 'dan@blog.com', role: 'reader' },
    { firstName: 'Eve', lastName: 'Wilson', email: 'eve@blog.com', role: 'reader' },
  ]);

  const alice = users[0]!;
  const bob = users[1]!;
  const carol = users[2]!;
  const dan = users[3]!;
  const eve = users[4]!;

  const posts = await Post.insertMany([
    { title: 'Intro to MongoDB', authorId: alice._id, category: 'database', status: 'published', viewCount: 1500, tags: ['mongodb', 'nosql', 'database'], publishedAt: new Date('2025-01-15') },
    { title: 'Advanced Mongoose', authorId: alice._id, category: 'database', status: 'published', viewCount: 980, tags: ['mongoose', 'mongodb', 'orm'], publishedAt: new Date('2025-02-20') },
    { title: 'REST API Best Practices', authorId: bob._id, category: 'api', status: 'published', viewCount: 2200, tags: ['rest', 'api', 'backend'], publishedAt: new Date('2025-01-10') },
    { title: 'GraphQL vs REST', authorId: bob._id, category: 'api', status: 'published', viewCount: 1800, tags: ['graphql', 'rest', 'api'], publishedAt: new Date('2025-03-05') },
    { title: 'Testing with Jest', authorId: alice._id, category: 'testing', status: 'published', viewCount: 3100, tags: ['jest', 'testing', 'tdd'], publishedAt: new Date('2025-02-01') },
    { title: 'Docker for Devs', authorId: bob._id, category: 'devops', status: 'draft', viewCount: 200, tags: ['docker', 'devops'] },
    { title: 'TypeScript Tips', authorId: alice._id, category: 'typescript', status: 'archived', viewCount: 500, tags: ['typescript', 'tips'] },
  ]);

  const introMongo = posts[0]!;
  const advMongoose = posts[1]!;
  const restApi = posts[2]!;
  const graphql = posts[3]!;
  const jest = posts[4]!;

  await Comment.insertMany([
    { postId: introMongo._id, authorId: bob._id, content: 'Great intro!', likes: 5 },
    { postId: introMongo._id, authorId: carol._id, content: 'Very helpful, thanks!', likes: 3 },
    { postId: introMongo._id, authorId: dan._id, content: 'Clear explanation.', likes: 1 },
    { postId: restApi._id, authorId: alice._id, content: 'Nice article Bob!', likes: 8 },
    { postId: restApi._id, authorId: eve._id, content: 'Learned a lot from this.', likes: 4 },
    { postId: restApi._id, authorId: dan._id, content: 'Could you cover HATEOAS?', likes: 2 },
    { postId: restApi._id, authorId: carol._id, content: 'Well structured.', likes: 6 },
    { postId: jest._id, authorId: bob._id, content: 'Jest is awesome!', likes: 10 },
    { postId: jest._id, authorId: dan._id, content: 'What about Vitest?', likes: 7 },
    { postId: graphql._id, authorId: eve._id, content: 'I prefer REST.', likes: 3 },
    { postId: advMongoose._id, authorId: carol._id, content: 'Need more examples.', likes: 2 },
  ]);
}

// --- Exercises ---

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/queries-exercise');
  console.log('=== Queries & Aggregation Exercise ===\n');

  await seedData();

  // ============================================
  // TODO 1: Find all published posts by a specific author
  // ============================================
  // Find all posts by Alice that have status 'published'.
  // Return only title, category, and viewCount fields.
  // Sort by viewCount descending.
  console.log('--- TODO 1: Published posts by Alice ---');
  // Your query here:

  // ============================================
  // TODO 2: Find posts with high engagement
  // ============================================
  // Find all published posts with viewCount >= 1000.
  // Populate the authorId field to include firstName and lastName.
  // Sort by viewCount descending.
  console.log('\n--- TODO 2: High engagement posts ---');
  // Your query here:

  // ============================================
  // TODO 3: Count comments per post
  // ============================================
  // Use aggregation to count the number of comments for each post.
  // Use $lookup to join with the posts collection to get the post title.
  // Sort by comment count descending.
  // Expected output: [{ title: '...', commentCount: N }, ...]
  console.log('\n--- TODO 3: Comments per post ---');
  // Your aggregation here:

  // ============================================
  // TODO 4: Find the most active commenters
  // ============================================
  // Use aggregation to find users who have written the most comments.
  // Include: user's full name, comment count, total likes received.
  // Use $lookup to join with users collection.
  // Sort by comment count descending. Limit to top 3.
  console.log('\n--- TODO 4: Most active commenters ---');
  // Your aggregation here:

  // ============================================
  // TODO 5: Category statistics
  // ============================================
  // Use aggregation on published posts to compute per-category stats:
  //   - category name
  //   - number of posts
  //   - total views across all posts in that category
  //   - average view count (rounded to nearest integer)
  // Sort by total views descending.
  console.log('\n--- TODO 5: Category statistics ---');
  // Your aggregation here:

  // ============================================
  // TODO 6: Find posts that have the "api" tag
  // ============================================
  // Find all published posts that contain "api" in their tags array.
  // Return title and tags only.
  console.log('\n--- TODO 6: Posts with "api" tag ---');
  // Your query here:

  // ============================================
  // TODO 7: Most liked comments with post and author info
  // ============================================
  // Use aggregation to find the top 5 most liked comments.
  // Include: comment content, likes, post title, commenter's full name.
  // You will need two $lookup stages (one for posts, one for users).
  console.log('\n--- TODO 7: Top liked comments ---');
  // Your aggregation here:

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
