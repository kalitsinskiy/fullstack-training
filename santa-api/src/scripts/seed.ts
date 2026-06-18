import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Wishlist, WishlistSchema } from '../wishlist/schemas/wishlist.schema';

type UserRole = 'user' | 'admin';
type RoomStatus = 'pending' | 'drawn';

interface SeedUser {
  email: string;
  displayName: string;
  role: UserRole;
}

interface SeedRoom {
  name: string;
  inviteCode: string;
  status: RoomStatus;
  drawDate?: Date;
  creatorEmail: string;
  participantEmails: string[];
}

const PASSWORD = 'Password123!';
const HASH_ROUNDS = 10;

const seedUsers: SeedUser[] = [
  {
    email: 'alice.santa@example.com',
    displayName: 'Alice Frost',
    role: 'admin',
  },
  {
    email: 'bob.santa@example.com',
    displayName: 'Bob Garland',
    role: 'user',
  },
  {
    email: 'carol.santa@example.com',
    displayName: 'Carol Snow',
    role: 'user',
  },
  {
    email: 'dave.santa@example.com',
    displayName: 'Dave Pine',
    role: 'user',
  },
  {
    email: 'eve.santa@example.com',
    displayName: 'Eve Holly',
    role: 'user',
  },
  {
    email: 'frank.santa@example.com',
    displayName: 'Frank Wreath',
    role: 'user',
  },
];

const seedRooms: SeedRoom[] = [
  {
    name: 'Family Secret Santa 2026',
    inviteCode: 'FAM26',
    status: 'pending',
    creatorEmail: 'alice.santa@example.com',
    participantEmails: [
      'alice.santa@example.com',
      'bob.santa@example.com',
      'carol.santa@example.com',
      'dave.santa@example.com',
    ],
  },
  {
    name: 'Office Gift Exchange',
    inviteCode: 'OFF26',
    status: 'drawn',
    drawDate: new Date('2026-12-10T18:00:00.000Z'),
    creatorEmail: 'eve.santa@example.com',
    participantEmails: [
      'eve.santa@example.com',
      'frank.santa@example.com',
      'alice.santa@example.com',
      'bob.santa@example.com',
    ],
  },
  {
    name: 'Friends Holiday Swap',
    inviteCode: 'FRD26',
    status: 'pending',
    creatorEmail: 'carol.santa@example.com',
    participantEmails: [
      'carol.santa@example.com',
      'dave.santa@example.com',
      'eve.santa@example.com',
      'frank.santa@example.com',
    ],
  },
];

function pickWishlistItems(index: number) {
  const presets = [
    [
      { name: 'Warm scarf', priority: 1 },
      { name: 'Coffee beans', priority: 2 },
      { name: 'Board game', priority: 3 },
    ],
    [
      { name: 'Wireless earbuds', priority: 1 },
      { name: 'Desk lamp', priority: 2 },
      { name: 'Notebook set', priority: 3 },
    ],
    [
      { name: 'Tea sampler', priority: 1 },
      { name: 'Wool socks', priority: 2 },
      { name: 'Gift card', priority: 3 },
    ],
  ];

  return presets[index % presets.length].map((item) => ({
    ...item,
    url: `https://example.com/gifts/${item.name
      .toLowerCase()
      .replace(/\s+/g, '-')}`,
  }));
}

async function seed() {
  const mongoUrl =
    process.env.MONGO_URL ?? 'mongodb://localhost:27017/santa-api';
  const appendMode = process.argv.includes('--append');

  await mongoose.connect(mongoUrl);

  const UserModel = mongoose.model(User.name, UserSchema);
  const RoomModel = mongoose.model(Room.name, RoomSchema);
  const WishlistModel = mongoose.model(Wishlist.name, WishlistSchema);

  if (!appendMode) {
    await Promise.all([
      UserModel.deleteMany({}),
      RoomModel.deleteMany({}),
      WishlistModel.deleteMany({}),
    ]);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, HASH_ROUNDS);

  const users = await UserModel.insertMany(
    seedUsers.map((user) => ({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      passwordHash,
    })),
    { ordered: false },
  ).catch(async (error: unknown) => {
    if (appendMode) {
      const existingUsers = await UserModel.find({
        email: { $in: seedUsers.map((user) => user.email) },
      }).exec();
      return existingUsers;
    }
    throw error;
  });

  const userByEmail = new Map(users.map((user) => [user.email, user]));

  const roomsPayload = seedRooms.map((room) => {
    const creator = userByEmail.get(room.creatorEmail);
    if (!creator) {
      throw new Error(`Missing creator user for ${room.creatorEmail}`);
    }

    const participants = room.participantEmails.map((email) => {
      const participant = userByEmail.get(email);
      if (!participant) {
        throw new Error(`Missing participant user for ${email}`);
      }
      return participant._id;
    });

    return {
      name: room.name,
      inviteCode: room.inviteCode,
      status: room.status,
      drawDate: room.drawDate,
      creatorId: creator._id,
      participants,
    };
  });

  const rooms = await RoomModel.insertMany(roomsPayload, {
    ordered: false,
  }).catch(async (error: unknown) => {
    if (appendMode) {
      const existingRooms = await RoomModel.find({
        inviteCode: { $in: seedRooms.map((room) => room.inviteCode) },
      }).exec();
      return existingRooms;
    }
    throw error;
  });

  const wishlistsPayload = rooms.flatMap((room, roomIndex) =>
    room.participants.map((participantId, participantIndex) => ({
      roomId: room._id,
      userId: participantId,
      items: pickWishlistItems(roomIndex + participantIndex),
    })),
  );

  await WishlistModel.insertMany(wishlistsPayload, { ordered: false }).catch(
    (error: unknown) => {
      if (appendMode) {
        return [];
      }
      throw error;
    },
  );

  console.log('Seed completed');
  console.log(`Mongo URL: ${mongoUrl}`);
  console.log(`Users: ${await UserModel.countDocuments()}`);
  console.log(`Rooms: ${await RoomModel.countDocuments()}`);
  console.log(`Wishlists: ${await WishlistModel.countDocuments()}`);
  console.log('Login password for seeded users: Password123!');
  console.table(
    seedUsers.map((user) => ({ email: user.email, role: user.role })),
  );

  await mongoose.disconnect();
}

void seed().catch(async (error: unknown) => {
  console.error('Seed failed');
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
