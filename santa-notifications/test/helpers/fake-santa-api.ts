import type {
  RoomDetails,
  RoomRelations,
  SantaApi,
  UserDetails,
} from '../../src/services/santa-api-client';

const NO_RELATIONS: RoomRelations = { gifteeId: null, santaId: null };

export class FakeSantaApi implements SantaApi {
  readonly roomCalls: string[] = [];
  readonly userCalls: string[] = [];
  readonly relationCalls: { roomId: string; userId: string }[] = [];
  failWith?: Error;

  relations: Record<string, RoomRelations> = {};

  constructor(
    private readonly rooms: Record<string, RoomDetails> = {},
    private readonly users: Record<string, UserDetails> = {}
  ) {}

  getRelations(roomId: string, userId: string): Promise<RoomRelations> {
    this.relationCalls.push({ roomId, userId });
    if (this.failWith) return Promise.reject(this.failWith);

    return Promise.resolve(this.relations[`${roomId}:${userId}`] ?? NO_RELATIONS);
  }

  getRoomById(roomId: string): Promise<RoomDetails> {
    this.roomCalls.push(roomId);
    if (this.failWith) return Promise.reject(this.failWith);

    const room = this.rooms[roomId];
    return room
      ? Promise.resolve(room)
      : Promise.reject(new Error(`FakeSantaApi: no room ${roomId}`));
  }

  getUserById(userId: string): Promise<UserDetails> {
    this.userCalls.push(userId);
    if (this.failWith) return Promise.reject(this.failWith);

    const user = this.users[userId];
    return user
      ? Promise.resolve(user)
      : Promise.reject(new Error(`FakeSantaApi: no user ${userId}`));
  }
}
