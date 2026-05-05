/* eslint-disable @typescript-eslint/no-unused-vars */
export {};
// ============================================
// Exercise: Blog App Schemas
// ============================================
// Run from santa-notifications/:  npx ts-node --transpile-only exercises/07-mongodb-and-mongoose/blog-schema.ts
// Requires: MongoDB 7.x running on localhost:27017

import mongoose, { Schema, model, Types } from 'mongoose';

// ============================================
// TODO 1: Define the IUser interface
// ============================================
// Fields:
//   - firstName: string (required)
//   - lastName: string (required)
//   - email: string (required, unique)
//   - bio: string (optional, max 500 chars)
//   - role: 'author' | 'editor' | 'reader' (default: 'reader')
//   - createdAt: Date
//   - updatedAt: Date

// Your interface here:

// ============================================
// TODO 2: Define the userSchema
// ============================================
// Requirements:
//   - Add validation: required fields, email format, bio maxlength
//   - Add timestamps: true
//   - Add a virtual "fullName" that returns "firstName lastName"
//   - Add an instance method "isAuthor()" that returns true if role is 'author'
//   - Add a toJSON transform that: renames _id to id, removes __v
//   - Add a unique index on email
//   - Add a text index on firstName + lastName (for search)

// Your schema here:

// ============================================
// TODO 3: Define the IPost interface
// ============================================
// Fields:
//   - title: string (required, min 5 chars, max 200 chars)
//   - slug: string (required, unique — URL-friendly version of title)
//   - content: string (required)
//   - excerpt: string (optional, max 300 chars)
//   - authorId: ObjectId reference to User (required)
//   - status: 'draft' | 'published' | 'archived' (default: 'draft')
//   - tags: string[] (default: [])
//   - viewCount: number (default: 0)
//   - publishedAt: Date (optional)
//   - createdAt: Date
//   - updatedAt: Date

// Your interface here:

// ============================================
// TODO 4: Define the postSchema
// ============================================
// Requirements:
//   - Add all validations from the interface above
//   - Add timestamps: true
//   - Add a hook that auto-generates slug from title (lowercase, replace spaces
//     with dashes, remove non-alphanumeric chars except dashes) — but ONLY if
//     title is modified and slug is not set
//   - Add indexes: unique on slug, compound on { authorId: 1, createdAt: -1 },
//     text index on { title: 'text', content: 'text' }
//
//   IMPORTANT: use `pre('validate')`, NOT `pre('save')`.
//   Mongoose runs schema validation BEFORE save hooks, so a pre-save hook
//   would fire too late — the `slug: required: true` check would fail
//   with a ValidationError. The `pre('validate')` hook runs early enough
//   to populate the slug before validation.

// Your schema here:

// ============================================
// TODO 5: Define the IComment interface
// ============================================
// Fields:
//   - postId: ObjectId reference to Post (required)
//   - authorId: ObjectId reference to User (required)
//   - content: string (required, min 1 char, max 2000 chars)
//   - parentCommentId: ObjectId reference to Comment (optional — for nested replies)
//   - likes: number (default: 0)
//   - createdAt: Date
//   - updatedAt: Date

// Your interface here:

// ============================================
// TODO 6: Define the commentSchema
// ============================================
// Requirements:
//   - Add all validations from the interface above
//   - Add timestamps: true
//   - Add indexes: compound on { postId: 1, createdAt: 1 } (for listing comments on a post),
//     single on { authorId: 1 }

// Your schema here:

// ============================================
// TODO 7: Compile models and test
// ============================================
// Create the User, Post, and Comment models.
// Then in the main() function below:
//   1. Create 2 users
//   2. Create 2 posts (one by each user)
//   3. Create 3 comments on the first post (one should be a reply to another)
//   4. Use populate to fetch a post with its author
//   5. Use populate to fetch comments with their authors
//   6. Console.log all results

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/blog-exercise');
  console.log('=== Blog Schema Exercise ===\n');

  // Clean up
  // await User.deleteMany({});
  // await Post.deleteMany({});
  // await Comment.deleteMany({});

  // TODO: Implement your test code here

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
