import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WishlistItemResponseDto {
  @ApiProperty({
    description: 'The name of the wishlist item',
    example: 'New Bicycle',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'A URL to the wishlist item',
    example: 'https://example.com/new-bicycle',
  })
  url?: string;

  @ApiPropertyOptional({
    description: 'The priority of the wishlist item',
    example: 1,
  })
  priority?: number;

  constructor(data: { name: string; url?: string; priority?: number }) {
    this.name = data.name;
    this.url = data.url;
    this.priority = data.priority;
  }
}

export class WishlistResponseDto {
  @ApiProperty({
    description: 'The ID of the wishlist',
    example: '60d0fe4f5311236168a109ca',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the user who owns the wishlist',
    example: '60d0fe4f5311236168a109ca',
  })
  userId: string;

  @ApiProperty({
    description: 'The ID of the room associated with the wishlist',
    example: '60d0fe4f5311236168a109ca',
  })
  roomId: string;

  @ApiProperty({
    description: 'The list of wishlist items',
    type: [WishlistItemResponseDto],
  })
  items: WishlistItemResponseDto[];

  @ApiProperty({
    description: 'The date and time when the wishlist was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the wishlist was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
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
