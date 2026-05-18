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
const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /.+@.+\..+/ },
    bio: { type: String, maxlength: 500 },
    role: { type: String, enum: ['author', 'editor', 'reader'], default: 'reader' },
  },
  { timestamps: true }
);

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
const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, minLength: 5, maxLength: 200 },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxLength: 300 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    tags: { type: [String], default: [] },
    viewCount: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

postSchema.pre('validate', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
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
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, minLength: 1, maxLength: 2000 },
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

  // TODO: Implement your test code here
  const users = await User.insertMany([
    {
      firstName: 'Stephen',
      lastName: 'King',
      email: 'stephen.king@example.com',
      bio: 'Stephen Edwin King is an American author. Dubbed the "King of Horror", he is widely known for his horror fiction and has also explored other genres, among them suspense, crime, science-fiction, fantasy, and mystery. He has written approximately 200 short stories, most of which have been published in collections.',
      role: 'author',
    },
    {
      firstName: 'Vitalii',
      lastName: 'Rozbyiholova',
      email: 'Vitalii.Rozbyiholova@example.com',
    },
  ]);
  const magaUser = await User.insertOne({
    firstName: 'MAGA',
    lastName: 'Forever',
    email: 'loveToBeLiedTo@social.media',
  });
  const anotherUser = await User.insertOne({
    firstName: 'Unknown',
    lastName: 'Incognito',
    email: 'whoIsThis@network.com',
  });
  const observerUser = await User.insertOne({
    firstName: 'I am just',
    lastName: 'WATCHING',
    email: 'bigBrother@watching.you',
  });

  console.log('Created users', users, magaUser, anotherUser, observerUser);

  const posts = await Post.insertMany([
    {
      title: 'Covard',
      content:
        "I think when a lot of people voted for Trump, they forgot the most salient fact: He never has to face the voters again. He's like a shuffling, reflexes-gone boxer who claims to have retired undefeated.",
      authorId: users.find((u) => u.email === 'stephen.king@example.com')!._id,
      status: 'published',
      tags: ['Donald Trump'],
      viewCount: 775624,
      publishedAt: new Date(2026, 5, 14, 12, 0, 35),
    },
    {
      title: 'What is this???',
      content: 'Ілона вбила твітер.',
      authorId: users.find((u) => u.email === 'Vitalii.Rozbyiholova@example.com')!._id,
      status: 'published',
      tags: ['Elon Musk'],
      viewCount: 18,
      publishedAt: new Date(2023, 3, 15, 18, 5, 33),
    },
  ]);

  console.log('Created posts', posts);

  const comment1 = await Comment.insertOne({
    postId: posts[0]!._id,
    authorId: magaUser._id,
    content:
      'Is it hate or royalty checks that fill your empty soul?   Asking for a former buyer of your good writing.',
    likes: 0,
  });

  const comment2 = await Comment.insertOne({
    postId: posts[0]!._id,
    authorId: anotherUser._id,
    content: 'Screw you! Trump will continue to play the victim in prison.',
    parentCommentId: comment1._id,
    likes: 54,
  });

  const comment3 = await Comment.insertOne({
    postId: posts[0]!._id,
    authorId: observerUser._id,
    content: "I'll find you",
    parentCommentId: comment2._id,
    likes: 1,
  });

  console.log('Created comments', comment1, comment2, comment3);
  console.log('==== Fetching the author by post ===');
  const postWithAuthor = await Post.findById(posts[0]._id).populate(
    'authorId',
    'firstName lastName email'
  );
  console.log('Post with author populated:', postWithAuthor);

  console.log('==== Fetching comments with authors ===');
  const commentsWithAuthors = await Comment.find({ postId: posts[0]._id }).populate(
    'authorId',
    'firstName lastName email'
  );
  console.log('Comments with authors populated:', commentsWithAuthors);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
