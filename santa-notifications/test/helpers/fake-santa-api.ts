import type { RoomDetails, SantaApi, UserDetails } from '../../src/services/santa-api-client';

export class FakeSantaApi implements SantaApi {
  readonly roomCalls: string[] = [];
  readonly userCalls: string[] = [];
  failWith?: Error;

  constructor(
    private readonly rooms: Record<string, RoomDetails> = {},
    private readonly users: Record<string, UserDetails> = {}
  ) {}

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
