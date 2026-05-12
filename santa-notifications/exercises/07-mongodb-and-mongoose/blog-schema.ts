/* eslint-disable @typescript-eslint/no-unused-vars */
export {};
// ============================================
// Exercise: Blog App Schemas
// ============================================
// Run from santa-notifications/:  npx ts-node --transpile-only exercises/07-mongodb-and-mongoose/blog-schema.ts
// Requires: MongoDB 7.x running on localhost:27017

import mongoose, { Model, Schema, model, Types } from 'mongoose';

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
}

interface IUserMethods {
  isAuthor(): boolean;
}

type UserModel = Model<IUser, object, IUserMethods>;

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

const emailPattern = /^\S+@\S+\.\S+$/;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailPattern, 'Invalid email format'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio must be at most 500 characters'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['author', 'editor', 'reader'],
      default: 'reader',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as Types.ObjectId).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.methods.isAuthor = function (): boolean {
  return this.role === 'author';
};

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

interface IPost {
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

const slugify = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title must be at most 200 characters'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
    },
    content: { type: String, required: [true, 'Content is required'] },
    excerpt: {
      type: String,
      maxlength: [300, 'Excerpt must be at most 300 characters'],
      trim: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    tags: { type: [String], default: [] },
    viewCount: { type: Number, default: 0, min: 0 },
    publishedAt: Date,
  },
  { timestamps: true }
);

postSchema.pre('validate', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title);
  }
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

interface IComment {
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
    content: {
      type: String,
      required: [true, 'Content is required'],
      minlength: [1, 'Content must be at least 1 character'],
      maxlength: [2000, 'Content must be at most 2000 characters'],
      trim: true,
    },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    likes: { type: Number, default: 0, min: 0 },
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

const User = model<IUser, UserModel>('User', userSchema);
const Post = model<IPost>('Post', postSchema);
const Comment = model<IComment>('Comment', commentSchema);

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/blog-exercise');
  console.log('=== Blog Schema Exercise ===\n');

  // Clean up
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});

  // TODO: Implement your test code here

  const [alice, ben] = await User.create([
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      bio: 'Backend author who writes about MongoDB and APIs.',
      role: 'author',
    },
    {
      firstName: 'Ben',
      lastName: 'Miller',
      email: 'ben@example.com',
      bio: 'Editor and reviewer for the platform.',
      role: 'editor',
    },
  ]);

  const [firstPost, secondPost] = await Post.create([
    {
      title: 'MongoDB Schema Patterns',
      content: 'A walkthrough of practical schema patterns for document databases.',
      excerpt: 'Practical schema patterns for document databases.',
      authorId: alice._id,
      status: 'published',
      tags: ['mongodb', 'schema'],
      viewCount: 120,
      publishedAt: new Date('2026-05-01'),
    },
    {
      title: 'Editorial Review Checklist',
      content: 'How editors can review technical blog posts before publishing.',
      excerpt: 'A concise editorial review checklist.',
      authorId: ben._id,
      status: 'draft',
      tags: ['editing', 'workflow'],
      viewCount: 45,
    },
  ]);

  const [firstComment, secondComment] = await Comment.create([
    {
      postId: firstPost._id,
      authorId: ben._id,
      content: 'Clear structure and good examples.',
      likes: 2,
    },
    {
      postId: firstPost._id,
      authorId: alice._id,
      content: 'Thanks, I will add a section on indexing next.',
      parentCommentId: undefined,
      likes: 1,
    },
  ]);

  const reply = await Comment.create({
    postId: firstPost._id,
    authorId: ben._id,
    content: 'That indexing section would be useful.',
    parentCommentId: secondComment._id,
    likes: 3,
  });

  const populatedPost = await Post.findById(firstPost._id).populate(
    'authorId',
    'firstName lastName email'
  );
  const populatedComments = await Comment.find({ postId: firstPost._id })
    .sort({ createdAt: 1 })
    .populate('authorId', 'firstName lastName role');

  console.log('Users:', [alice.toJSON(), ben.toJSON()]);
  console.log('Alice full name:', (alice.toJSON() as unknown as { fullName: string }).fullName);
  console.log('Alice is author?', alice.isAuthor());
  console.log('Posts:', [firstPost.toObject(), secondPost.toObject()]);
  console.log('Comments created:', [
    firstComment.toObject(),
    secondComment.toObject(),
    reply.toObject(),
  ]);
  console.log('Populated post:', populatedPost);
  console.log('Populated comments:', populatedComments);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
