export {};
// ============================================
// Mongoose Schema & Model
// ============================================
// Run: npx ts-node src/04-backend/lessons/07-mongodb-and-mongoose/examples/schema-and-model.ts
// Requires: MongoDB 7.x running on localhost:27017

import mongoose, { Schema, model } from 'mongoose';

// --- 1. Define TypeScript interfaces ---

interface IAddress {
  street: string;
  city: string;
  country: string;
  zip?: string;
}

interface IUser {
  email: string;
  passwordHash: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin';
  address?: IAddress;
  tags: string[];
  loginCount: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for instance methods
interface IUserMethods {
  fullName(): string;
  isAdmin(): boolean;
}

// Combined type for the model
type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

// --- 2. Define the schema ---

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],     // custom error message
      unique: true,
      lowercase: true,                            // auto-lowercase
      trim: true,                                 // auto-trim whitespace
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,       // excluded from query results by default
    },
    displayName: {
      type: String,
      required: true,
      minlength: [2, 'Display name must be at least 2 characters'],
      maxlength: [50, 'Display name must be at most 50 characters'],
    },
    firstName: String,
    lastName: String,
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'user',
    },
    address: {
      street: String,
      city: String,
      country: String,
      zip: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    loginCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginAt: Date,
  },
  {
    // Schema options
    timestamps: true,                    // auto createdAt + updatedAt
    toJSON: {
      virtuals: true,                    // include virtuals in JSON output
      transform(_doc: any, ret: any) {
        ret.id = ret._id.toString();     // rename _id to id
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;         // never expose password hash
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// --- 3. Virtuals (computed properties, not stored in DB) ---

userSchema.virtual('fullNameVirtual').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.displayName;
});

// --- 4. Instance methods ---

userSchema.methods.fullName = function (): string {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.displayName;
};

userSchema.methods.isAdmin = function (): boolean {
  return this.role === 'admin';
};

// --- 5. Static methods ---

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findAdmins = function () {
  return this.find({ role: 'admin' });
};

// --- 6. Indexes ---
// Note: `email: { unique: true }` in the schema definition above already creates
// a unique index. Don't redeclare it here — Mongoose will warn about a duplicate.

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ displayName: 'text', firstName: 'text', lastName: 'text' });

// --- 7. Middleware (hooks) ---

userSchema.pre('save', function () {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
});

userSchema.post('save', function (doc) {
  console.log(`[Hook] User saved: ${doc.email}`);
});

// --- 8. Compile the model ---

const User = model<IUser, UserModel>('User', userSchema);

// --- Run ---

async function main(): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/schema-example');
  console.log('=== Schema & Model Examples ===\n');

  // Clean up
  await User.deleteMany({});

  // Create a user
  const user = await User.create({
    email: 'Alice@Example.com',  // will be lowercased
    passwordHash: 'hashed_password_123',
    displayName: 'Alice',
    firstName: 'Alice',
    lastName: 'Smith',
    tags: ['developer', 'mentor'],
  });

  console.log('Created user:', user.toJSON());
  console.log('Full name (method):', user.fullName());
  console.log('Is admin:', user.isAdmin());

  // Access virtual
  console.log('Profile URL virtual:', (user as any).fullNameVirtual);

  // Query with password field explicitly selected
  const withPassword = await User.findById(user._id).select('+passwordHash');
  console.log('\nWith password selected:', withPassword?.passwordHash ? 'has hash' : 'no hash');

  // Query without password (default)
  const withoutPassword = await User.findById(user._id);
  console.log('Without password selected:', withoutPassword?.passwordHash ?? 'undefined (correct!)');

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(console.error);
