# MongoDB & Mongoose

## Quick Overview

MongoDB is a document database that stores data as flexible JSON-like documents (BSON). Mongoose is an ODM (Object Data Modeling) library that provides schema-based modeling on top of MongoDB in Node.js. Together, they give you the flexibility of a NoSQL database with the structure and validation of an ORM.

## Key Concepts

### Document Databases vs Relational

| Feature | MongoDB (Document) | PostgreSQL (Relational) |
|---|---|---|
| Data model | JSON-like documents | Tables with rows/columns |
| Schema | Flexible (schema-less at DB level) | Strict schema, migrations |
| Relationships | Embedded documents or references | Foreign keys, JOINs |
| Scaling | Horizontal (sharding) | Vertical (bigger machine) |
| Best for | Varied/nested data, rapid iteration | Complex relations, ACID transactions |

**When to use MongoDB**: user profiles, content management, catalogs, real-time analytics, IoT data, prototypes where schema evolves frequently.

**When to use SQL**: financial transactions, complex reporting with JOINs, strict data integrity requirements.

### MongoDB Basics

MongoDB organizes data into **databases** > **collections** > **documents**.

```typescript
// A MongoDB document (stored as BSON internally)
{
  _id: ObjectId('507f1f77bcf86cd799439011'),
  email: 'alice@example.com',
  displayName: 'Alice',
  rooms: [ObjectId('507f1f77bcf86cd799439022')],
  createdAt: ISODate('2025-01-15T10:30:00Z')
}
```

Key concepts:
- **Document**: a JSON-like record (up to 16MB)
- **Collection**: a group of documents (like a table)
- **BSON**: Binary JSON — MongoDB's storage format, supports additional types like `ObjectId`, `Date`, `Decimal128`
- **`_id`**: every document has a unique `_id` field (auto-generated `ObjectId` by default)

### Connecting with Mongoose

```typescript
import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/santa-api', {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});

// Listen for connection events
mongoose.connection.on('connected', () => console.log('MongoDB connected'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
```

### Schemas, Models, and Options

A **schema** defines the structure and validation rules. A **model** is a constructor compiled from the schema that provides CRUD operations.

```typescript
import { Schema, model } from 'mongoose';

// 1. Define a TypeScript interface
interface IUser {
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the schema
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, minlength: 2, maxlength: 50 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,       // auto-adds createdAt + updatedAt
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

// 3. Compile the model
const User = model<IUser>('User', userSchema);
```

### Schema Data Types

```typescript
const exampleSchema = new Schema({
  name: String,                                   // shorthand
  age: { type: Number, min: 0, max: 150 },       // with validation
  email: { type: String, required: true },
  tags: [String],                                 // array of strings
  address: {                                      // embedded sub-document
    street: String,
    city: String,
    zip: String,
  },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' }, // reference
  metadata: Schema.Types.Mixed,                   // any shape
  isActive: { type: Boolean, default: true },
});
```

### Virtuals and Methods

```typescript
// Virtual — computed property, not stored in DB
userSchema.virtual('profileUrl').get(function () {
  return `/users/${this._id}`;
});

// Instance method
userSchema.methods.isAdmin = function (): boolean {
  return this.role === 'admin';
};

// Static method
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};
```

### Indexes

Indexes speed up queries. Without them, MongoDB scans every document (collection scan).

```typescript
// Single field index
userSchema.index({ email: 1 });              // ascending

// Compound index (multi-field)
userSchema.index({ roomId: 1, createdAt: -1 }); // roomId asc, createdAt desc

// Unique index (enforced at DB level)
userSchema.index({ email: 1 }, { unique: true });

// Text index (for full-text search)
userSchema.index({ displayName: 'text', email: 'text' });

// TTL index (auto-delete documents after time)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
```

### CRUD Operations

```typescript
// CREATE
const user = await User.create({
  email: 'bob@example.com',
  displayName: 'Bob',
  passwordHash: '...',
});

// READ
const allUsers = await User.find();                     // all documents
const admins = await User.find({ role: 'admin' });      // filter
const one = await User.findById('507f1f77bcf86cd79943'); // by ID
const byEmail = await User.findOne({ email: 'bob@example.com' });

// Projection — return only specific fields
const names = await User.find({}, 'displayName email');

// Pagination
const page = await User.find()
  .sort({ createdAt: -1 })
  .skip(20)
  .limit(10);

// UPDATE
await User.findByIdAndUpdate(id, { displayName: 'Robert' }, { new: true });
await User.updateMany({ role: 'user' }, { $set: { isActive: true } });

// DELETE
await User.findByIdAndDelete(id);
await User.deleteMany({ isActive: false });
```

### References and Population

Instead of embedding entire documents, store an `ObjectId` reference and use `populate()` to resolve it.

```typescript
const roomSchema = new Schema({
  name: String,
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

// Populate replaces ObjectId with the actual document
const room = await Room.findById(roomId)
  .populate('creatorId', 'displayName email')
  .populate('participants', 'displayName');
// room.creatorId is now { _id, displayName, email } instead of an ObjectId
```

**When to embed vs reference:**
- **Embed** when: data is always read together, belongs to the parent, rarely changes independently (e.g., address in user)
- **Reference** when: data is shared across documents, has its own lifecycle, can grow unbounded (e.g., users in a room)

### Aggregation Pipeline

Aggregation pipelines process documents through a sequence of stages. Each stage transforms the data.

```typescript
const result = await Post.aggregate([
  { $match: { status: 'published' } },         // 1. filter
  { $group: {                                   // 2. group by author
      _id: '$authorId',
      postCount: { $sum: 1 },
      lastPost: { $max: '$createdAt' },
    }},
  { $sort: { postCount: -1 } },                // 3. sort descending
  { $limit: 10 },                              // 4. top 10
  { $lookup: {                                  // 5. join with users
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'author',
    }},
  { $unwind: '$author' },                      // 6. flatten array
  { $project: {                                 // 7. shape output
      authorName: '$author.displayName',
      postCount: 1,
      lastPost: 1,
    }},
]);
```

Common stages: `$match`, `$group`, `$sort`, `$project`, `$limit`, `$skip`, `$lookup` (join), `$unwind`, `$count`, `$addFields`.

### Middleware (Hooks)

Mongoose middleware lets you run logic before or after certain operations.

```typescript
// Pre-save hook — runs before document.save()
userSchema.pre('save', async function (next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Post-save hook — runs after document is saved
userSchema.post('save', function (doc) {
  console.log(`User ${doc.email} was saved`);
});

// Pre-find hook — runs before any find query
userSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } }); // soft-delete filter
});
```

### Repository Pattern

Wrap Mongoose operations behind a repository class to decouple your business logic from the database.

```typescript
class UserRepository {
  async create(data: CreateUserDto): Promise<IUser> {
    return User.create(data);
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<void> {
    await User.findByIdAndDelete(id);
  }
}
```

This makes it easy to swap MongoDB for another database later and simplifies testing (mock the repository, not Mongoose).

## Learn More

- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [Mongoose Schemas](https://mongoosejs.com/docs/schematypes.html)
- [Mongoose Queries](https://mongoosejs.com/docs/queries.html)
- [Mongoose Population](https://mongoosejs.com/docs/populate.html)
- [Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)

## How to Work

> **Important:** examples and exercises must run from the `santa-notifications/` directory.
> Mongoose 9.x has issues loading from the repo root with the project's tsconfig (`module: nodenext`).
> The local copies inside `santa-notifications/{examples,exercises}/07-...` use a clean tsconfig that works.
>
> **Tip:** use `--transpile-only` for ts-node — full typechecking across the project takes 60+ seconds and isn't needed to run the examples. The IDE already shows type errors as you edit.

### One-time setup

1. **Start MongoDB 7.x** — required for full Mongoose 9 feature support (older versions like 4.x will run, but some aggregation operators and `$lookup` features may behave differently). Use Docker:
   ```bash
   docker run -d --name mongodb -p 27017:27017 mongo:7
   ```

   Or install locally — see the [MongoDB Community 7 install guide](https://www.mongodb.com/docs/manual/administration/install-community/).

2. **Install Mongoose in `santa-notifications`**:
   ```bash
   cd santa-notifications
   npm install mongoose
   ```

   The `tsconfig.json` in `santa-notifications/` must include `examples/**/*` and `exercises/**/*`. If it only has `src/**/*`, update the `include` array to:
   ```json
   "include": ["src/**/*", "examples/**/*", "exercises/**/*"]
   ```

### Run

1. **Study examples** (run from `santa-notifications/`):
   ```bash
   cd santa-notifications
   npx ts-node --transpile-only examples/07-mongodb-and-mongoose/connection.ts
   npx ts-node --transpile-only examples/07-mongodb-and-mongoose/schema-and-model.ts
   npx ts-node --transpile-only examples/07-mongodb-and-mongoose/crud-operations.ts
   npx ts-node --transpile-only examples/07-mongodb-and-mongoose/aggregation.ts
   ```

   Each example connects to its own database (`example-db`, `schema-example`, `crud-example`, `aggregation-example`) and cleans it up before running.

2. **Complete exercises** (run from `santa-notifications/`):
   ```bash
   cd santa-notifications
   npx ts-node --transpile-only exercises/07-mongodb-and-mongoose/blog-schema.ts
   npx ts-node --transpile-only exercises/07-mongodb-and-mongoose/queries.ts
   npx ts-node --transpile-only exercises/07-mongodb-and-mongoose/crud-exercise.ts
   ```

3. **Complete the App Task** below.

## App Task

See [exercises/app-task.md](exercises/app-task.md) — replace in-memory `Map` stores with Mongoose models in both services. Defines User/Room/Wishlist schemas in santa-api and Notification in santa-notifications, plus the indexes you need.
