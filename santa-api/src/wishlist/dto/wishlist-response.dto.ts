export class WishlistItemResponseDto {
  name: string;
  url?: string;
  priority?: number;

  constructor(data: { name: string; url?: string; priority?: number }) {
    this.name = data.name;
    this.url = data.url;
    this.priority = data.priority;
  }
}

export class WishlistResponseDto {
  id: string;
  userId: string;
  roomId: string;
  items: WishlistItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    _id?: string;
    id?: string;
    userId: { toString(): string };
    roomId: { toString(): string };
    items: Array<{ name: string; url?: string; priority?: number }>;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const idValue = (data.id || data._id)?.toString() || '';
    this.id = idValue;
    this.userId = data.userId.toString();
    this.roomId = data.roomId.toString();
    this.items = data.items.map((item) => new WishlistItemResponseDto(item));
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
