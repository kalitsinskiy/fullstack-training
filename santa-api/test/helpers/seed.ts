import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { User } from '../../src/users/schemas/user.schema';
import { Room } from '../../src/rooms/schemas/room.schema';
import { userFixture, roomFixture } from '../factories';
import { tokenFor } from '../auth-token.helper';

/**
 * Shared DB seeders for the e2e specs. Because each spec's `app` is recreated in
 * `beforeEach`, pass a GETTER (`() => app`) so every call reads the current instance.
 *
 *   const { seedUser, seedOwnerAndMember } = makeSeeders(() => app);
 */
export function makeSeeders(getApp: () => NestFastifyApplication) {
  async function seedUser(overrides: Record<string, unknown> = {}) {
    const app = getApp();
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const user = await userModel.create(userFixture(overrides));

    return { user, token: tokenFor(jwt, user) };
  }

  async function seedDrawableRoom() {
    const owner = await seedUser({ displayName: 'Alice' });
    const m1 = await seedUser({ displayName: 'Bob' });
    const m2 = await seedUser({ displayName: 'Alex' });
    const roomModel = getApp().get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner.user.id,
        participants: [
          { userId: owner.user._id, role: 'owner' },
          { userId: m1.user._id, role: 'member' },
          { userId: m2.user._id, role: 'member' },
        ],
      }),
    );

    return { owner, m1, m2, room, roomModel };
  }

  async function seedOwnerAndMember() {
    const owner = await seedUser({ displayName: 'Owner' });
    const member = await seedUser({ displayName: 'Member' });
    const roomModel = getApp().get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: owner.user._id,
        participants: [
          { userId: owner.user._id, role: 'owner' },
          { userId: member.user._id, role: 'member' },
        ],
      }),
    );

    return { owner, member, room, roomModel };
  }

  /** A single user who owns a fresh room (no other members). */
  async function seedUserAndRoom() {
    const user = await seedUser();
    const roomModel = getApp().get<Model<Room>>(getModelToken(Room.name));
    const room = await roomModel.create(
      roomFixture({
        creatorId: user.user._id,
        participants: [{ userId: user.user._id, role: 'owner' }],
      }),
    );

    return { user: user.user, room, token: user.token };
  }

  return { seedUser, seedDrawableRoom, seedOwnerAndMember, seedUserAndRoom };
}
