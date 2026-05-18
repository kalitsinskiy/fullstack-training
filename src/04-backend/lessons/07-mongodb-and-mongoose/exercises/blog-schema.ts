/* eslint-disable @typescript-eslint/no-unused-vars */
export {};
// ============================================
// Exercise: Blog App Schemas
// ============================================
// Run from santa-notifications/:  npx ts-node --transpile-only exercises/07-mongodb-and-mongoose/blog-schema.ts
// Requires: MongoDB 7.x running on localhost:27017
import mongoose, { Schema, model, Types, Document } from 'mongoose';

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
interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  role: 'author' | 'editor' | 'reader';
  createdAt: Date;
  updatedAt: Date;
  fullName: string; // virtual
  isAuthor(): boolean; // instance method
}

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
const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: { type: String, maxlength: 500 },
    role: {
      type: String,
      enum: ['author', 'editor', 'reader'],
      default: 'reader',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
      virtuals: true,
    },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.methods['isAuthor'] = function (this: IUser): boolean {
  return this.role === 'author';
};

userSchema.index({ email: 1 });
userSchema.index({ firstName: 'text', lastName: 'text' });

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
interface IPost extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  authorId: Types.ObjectId;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  viewCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, minlength: 5, maxlength: 200 },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 300 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    tags: { type: [String], default: [] },
    viewCount: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

postSchema.pre('validate', function (this: IPost, next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  next();
});

postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' });

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
interface IComment extends Document {
  postId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  parentCommentId?: Types.ObjectId;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TODO 6: Define the commentSchema
// ============================================
// Requirements:
//   - Add all validations from the interface above
//   - Add timestamps: true
//   - Add indexes: compound on { postId: 1, createdAt: 1 } (for listing comments on a post),
//     single on { authorId: 1 }

// Your schema here:
const commentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, minlength: 1, maxlength: 2000 },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ authorId: 1 });

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
const User = model<IUser>('User', userSchema);
const Post = model<IPost>('Post', postSchema);
const Comment = model<IComment>('Comment', commentSchema);

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/blog-exercise');
  console.log('=== Blog Schema Exercise ===\n');

  // Clean up
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});

  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});

  // TODO: Implement your test code here
  // 1. Create 2 users
  const alice = await User.create({
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    bio: 'Tech writer and open-source enthusiast.',
    role: 'author',
  });
  const bob = await User.create({
    firstName: 'Bob',
    lastName: 'Jones',
    email: 'bob@example.com',
    role: 'reader',
  });

  console.log('Users created:');
  console.log(alice.toJSON());
  console.log(`Alice fullName: ${alice.fullName}`);
  console.log(`Alice isAuthor: ${alice.isAuthor()}`);
  console.log(bob.toJSON());

  // 2. Create 2 posts (one by each user)
  const post1 = await Post.create({
    title: 'Getting Started with Mongoose',
    content: 'Mongoose is an elegant MongoDB object modeling tool for Node.js...',
    excerpt: 'A beginner guide to Mongoose.',
    authorId: alice._id,
    status: 'published',
    tags: ['mongodb', 'mongoose', 'nodejs'],
  });
  const post2 = await Post.create({
    title: 'Understanding MongoDB Indexes',
    content: 'Indexes are special data structures that store a small portion of...',
    authorId: bob._id,
    tags: ['mongodb', 'performance'],
  });

  console.log('\nPosts created:');
  console.log(post1.toObject());
  console.log(post2.toObject());

  // 3. Create 3 comments on the first post (one reply)
  const comment1 = await Comment.create({
    postId: post1._id,
    authorId: alice._id,
    content: 'Great introduction! Really helped me understand schemas.',
  });
  const comment2 = await Comment.create({
    postId: post1._id,
    authorId: bob._id,
    content: 'Thanks for the article, very clear explanation.',
  });
  const comment3 = await Comment.create({
    postId: post1._id,
    authorId: alice._id,
    content: 'Glad it helped!',
    parentCommentId: comment2._id,
  });

  console.log('\nComments created:');
  console.log(comment1.toObject());
  console.log(comment2.toObject());
  console.log(comment3.toObject());

  // 4. Fetch post with author
  const populatedPost = await Post.findById(post1._id).populate('authorId');
  console.log('\nPost with author:');
  console.log(JSON.stringify(populatedPost, null, 2));

  // 5. Fetch comments with authors
  const populatedComments = await Comment.find({ postId: post1._id }).populate('authorId');
  console.log('\nComments with authors:');
  populatedComments.forEach((c) => console.log(JSON.stringify(c, null, 2)));
  // await Post.deleteMany({});
  // await Comment.deleteMany({});

  // TODO: Implement your test code here

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
