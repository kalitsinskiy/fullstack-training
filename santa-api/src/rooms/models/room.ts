export interface Room {
  id: string;
  name: string;
  ownerId: string;
  code: string;
  members: string[];
  createdAt: Date;
}

type CreateRoomDto = Pick<Room, 'name' | 'ownerId'>;

export type { CreateRoomDto };
