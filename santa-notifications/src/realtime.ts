import type { Server } from 'socket.io';

export interface RealtimePublisher {
  toUser(userId: string, event: string, payload: unknown): void;
  toRoom(roomId: string, event: string, payload: unknown): void;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function santaRoom(roomId: string): string {
  return `room:${roomId}`;
}

export function createRealtimePublisher(io: Server): RealtimePublisher {
  return {
    toUser(userId, event, payload) {
      io.to(userRoom(userId)).emit(event, payload);
    },
    toRoom(roomId, event, payload) {
      io.to(santaRoom(roomId)).emit(event, payload);
    },
  };
}

export const noopRealtimePublisher: RealtimePublisher = {
  toUser() {},
  toRoom() {},
};
