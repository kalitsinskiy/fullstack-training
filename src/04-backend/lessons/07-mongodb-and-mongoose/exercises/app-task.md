# App Task: Replace In-Memory Storage with MongoDB

This is the lesson where both services finally get a real database. You'll define Mongoose schemas, swap every `Map`-based store for a Mongoose model, and add the right indexes.

> Prerequisites: santa-api with Users/Rooms/Wishlist modules (Lessons 04-05) and santa-notifications with the routes/plugins structure (Lessons 02-03). Both services already log via Pino (Lesson 06).

---

## 0. Run MongoDB

Use Docker:
```bash
docker run -d --name santa-mongo -p 27017:27017 mongo:7
```

Or extend the existing `docker-compose.yml` at the repo root:
```yaml
services:
  mongodb:
    image: mongo:7
    ports:
      - '27017:27017'
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:
```

Verify: `docker exec -it santa-mongo mongosh --eval 'db.adminCommand({ ping: 1 })'` → `{ ok: 1 }`.

---

## Part A — santa-api (NestJS + Mongoose)

### A.1 Install

```bash
cd santa-api
npm install @nestjs/mongoose mongoose
```

### A.2 Configure connection

In `src/app.module.ts`, add `MongooseModule.forRoot(...)`:

```typescript
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL ?? 'mongodb://localhost:27017/santa-api'),
    LoggerModule.forRoot({ /* from Lesson 06 */ }),
    UsersModule,
    RoomsModule,
    WishlistModule,
  ],
})
export class AppModule {}
```

### A.3 User schema + model

Create `src/users/schemas/user.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false }) // never returned by default
  passwordHash!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';
}

export const UserSchema = SchemaFactory.createForClass(User);
```

> `passwordHash` is required by the schema but won't be touched until Lesson 08 (Auth). For now, set it to a placeholder string in `UsersService.create` so existing endpoints keep working — e.g. `passwordHash: 'TODO_LESSON_08'`.

Register the model in `src/users/users.module.ts`:

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  // ...
})
```

### A.4 Refactor UsersService

Inject the model and replace the `Map`:

```typescript
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  create(dto: CreateUserDto) {
    return this.userModel.create({
      email: dto.email,
      displayName: dto.name,
      passwordHash: 'TODO_LESSON_08',
    });
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }
}
```

`UsersController` keeps the same endpoints — only the storage backend changes. If `findById` returns `null`, throw `NotFoundException` so your Lesson 05 filter formats the 404.

### A.5 Room schema + service

`src/rooms/schemas/room.schema.ts`:

```typescript
@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  inviteCode!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participants!: Types.ObjectId[];

  @Prop({ enum: ['pending', 'drawn'], default: 'pending' })
  status!: 'pending' | 'drawn';

  @Prop()
  drawDate?: Date;
}
```

Refactor `RoomsService` to use the model:
- `create({ name, ownerId })` — generate a 6-char unique `inviteCode`, set `creatorId = ownerId`, `participants = [ownerId]`
- `findAll()` → `roomModel.find().exec()`
- `findById(id)` → `roomModel.findById(id).exec()`
- `findByCode(code)` → `roomModel.findOne({ inviteCode: code }).exec()`
- `addMember(code, userId)` → `roomModel.findOneAndUpdate({ inviteCode: code }, { $addToSet: { participants: userId } }, { new: true }).exec()` (`$addToSet` avoids duplicates)

### A.6 Wishlist schema + service

`src/wishlist/schemas/wishlist.schema.ts`:

```typescript
@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  roomId!: Types.ObjectId;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        url: { type: String },
        priority: { type: Number },
      },
    ],
    default: [],
  })
  items!: Array<{ name: string; url?: string; priority?: number }>;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Compound unique index — one wishlist per (user, room)
WishlistSchema.index({ userId: 1, roomId: 1 }, { unique: true });
```

Update `UpdateWishlistDto` from Lesson 05 so `items` is now an array of `{ name; url?; priority? }` objects (not just strings) — add `@ValidateNested({ each: true })` + a `WishlistItemDto`.

`WishlistService`:
- `set(roomId, userId, items)` → `findOneAndUpdate({ userId, roomId }, { $set: { items } }, { upsert: true, new: true })`
- `get(roomId, userId)` → `findOne({ userId, roomId })`

---

## Part B — santa-notifications (raw Fastify + Mongoose)

### B.1 Install

```bash
cd santa-notifications
npm install mongoose
```

Make sure `tsconfig.json` includes `examples/**/*` and `exercises/**/*` if you ran the lesson examples there.

### B.2 Connect on startup

Create `src/db.ts`:

```typescript
import mongoose from 'mongoose';

export async function connectDb(url = process.env.MONGO_URL ?? 'mongodb://localhost:27017/santa-notifications') {
  mongoose.set('strictQuery', true);
  await mongoose.connect(url, { maxPoolSize: 10 });
}
```

In `src/server.ts`, await `connectDb()` before `app.listen(...)`. Log success/failure via `app.log`.

### B.3 Notification schema + model

Create `src/models/notification.ts`:

```typescript
import { Schema, model, Types } from 'mongoose';

const notificationSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['room_invite', 'assignment', 'wishlist_update', 'system'],
    required: true,
  },
  payload: { type: Schema.Types.Mixed },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = model('Notification', notificationSchema);
```

### B.4 Refactor routes

In `routes/notifications.ts`:
- Drop the in-memory array + `nextId` counter
- `POST /` → `NotificationModel.create({...})`
- `GET /` → `NotificationModel.find(query).sort({ createdAt: -1 })` (filter by `userId` if provided)
- `GET /:id` → `NotificationModel.findById(id)` — throw `NotFoundError('Notification', id)` (from Lesson 06) if null
- `PATCH /:id/read` → `NotificationModel.findByIdAndUpdate(id, { read: true }, { new: true })`
- `DELETE /:id` → `NotificationModel.findByIdAndDelete(id)`

Update path schemas: `id` is now a Mongo ObjectId hex string (24 chars), so use `pattern: '^[a-fA-F0-9]{24}$'` in your AJV `params` schema. `userId` query stays UUID format if you keep that contract.

---

## Final verification

```bash
# Both services connect on start, MongoDB log lines via Pino
cd santa-api && npm run start &
cd santa-notifications && npx ts-node src/server.ts &

# 1. Create a user — saved in mongodb
curl -s -X POST http://localhost:3001/users -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
# → 201 with a Mongo _id

# 2. Restart santa-api, GET /users/<id> — still there
docker exec -it santa-mongo mongosh santa-api --eval 'db.users.find().pretty()'

# 3. Unique email enforced
curl -s -X POST http://localhost:3001/users -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"alice@example.com"}'
# → 500 / 409 from MongoDB E11000 (Lesson 09 will format this nicer)

# 4. Wishlist upserts
curl -s -X POST http://localhost:3001/rooms/<roomId>/wishlist \
  -H "Content-Type: application/json" \
  -d '{"userId":"<uid>","items":[{"name":"book"},{"name":"socks","priority":1}]}'
# Repeat the same request → no duplicate document (compound unique index)

# 5. Notifications persist across restarts
curl -s -X POST http://localhost:3002/api/notifications -H "Content-Type: application/json" \
  -d '{"userId":"<uid>","type":"system","message":"hello"}'
curl -s http://localhost:3002/api/notifications
# → array with the notification
```

## What you have now

Both services persist data in MongoDB. Lesson 08 (Auth) will fill in the real `passwordHash`, add login flow + JWT, and start using `Room.creatorId` for ownership checks.
