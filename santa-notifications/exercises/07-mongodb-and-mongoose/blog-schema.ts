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
interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  role: 'author' | 'editor' | 'reader';
  createdAt: Date;
  updatedAt: Date;
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
interface IUserMethods {
  isAuthor(): boolean;
}

interface IUserVirtuals {
  fullName: string;
}

type UserModel = mongoose.Model<IUser, object, IUserMethods, IUserVirtuals>;

const userSchema = new Schema<IUser, UserModel, IUserMethods, Record<string, never>, IUserVirtuals>(
  {
    firstName: {
      type: String,
      required: [true, 'First Name is required'],
      minLength: [2, 'First Name must have at least 2 chars'],
    },
    lastName: {
      type: String,
      required: [true, 'Last Name is required'],
      minLength: [2, 'Last Name must have at least 2 chars'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    role: {
      type: String,
      enum: {
        values: ['author', 'editor', 'reader'],
        message: '{VALUE} is not a valid role',
      },
      default: 'reader',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
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
  staus: 'draft' | 'published' | 'archived';
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
    title: {
      type: String,
      required: true,
      minLength: [5, 'Title must be at leats 5 chars'],
      maxLength: [200, 'Title must be max of 200 chars'],
    },
    slug: {
      type: String,
      required: true,
      unique: [true, 'Slug must be unique userfriendli URL version of title'],
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      maxLength: 300,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    staus: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
    },
    tags: {
      type: [String],
      default: [],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

postSchema.pre('validate', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
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
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment must not be empty'],
      minLength: 1,
      maxLength: 2000,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
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

async function seedData(): Promise<void> {
  // Cleanup
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});

  const [alice, bob] = await User.create([
    {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      role: 'author',
      bio: 'Senior tech writer.',
    },
    {
      firstName: 'Bob',
      lastName: 'Jones',
      email: 'bob@example.com',
      role: 'editor',
    },
  ]);

  const [post1] = await Post.create([
    {
      title: 'Getting Started with Mongoose',
      content: 'Mongoose is an ODM for MongoDB...',
      authorId: alice._id,
      tags: ['mongodb', 'nodejs'],
    },
    {
      title: 'Advanced TypeScript Tips',
      content: 'TypeScript generics can be tricky...',
      authorId: bob._id,
      tags: ['typescript'],
    },
  ]);

  const [comment1, , comment3] = await Comment.create([
    { postId: post1._id, authorId: alice._id, content: 'Great intro post!' },
    { postId: post1._id, authorId: bob._id, content: 'Very helpful, thanks!' },
    { postId: post1._id, authorId: bob._id, content: 'Agreed, really clear explanation.' },
  ]);
  comment3.parentCommentId = comment1._id;
  await comment3.save();
}

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/blog-exercise');
  console.log('=== Blog Schema Exercise ===\n');

  await seedData();

  const allUsers = await User.find();
  console.log('--- Users ---');
  allUsers.forEach((u) => console.log(u.toJSON()));

  const allPosts = await Post.find().populate('authorId');
  console.log('\n--- Posts (with author) ---');
  allPosts.forEach((p) => console.log(p.toJSON()));

  const allComments = await Comment.find().populate('authorId').populate('postId');
  console.log('\n--- Comments (with author & post) ---');
  allComments.forEach((c) => console.log(c.toJSON()));

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
