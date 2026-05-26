import { ApiProperty } from '@nestjs/swagger';
import { WishlistItemDto } from './update-wishlist.dto';

export class WishlistResponseDto {
  @ApiProperty({
    description: 'Room identifier that owns this wishlist',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  roomId!: string;

  @ApiProperty({
    description: 'User identifier that owns this wishlist',
    example: '665f0c2ab7d13a5e8b1c4d1a',
  })
  userId!: string;

  @ApiProperty({
    description: 'Wishlist items for the selected room',
    type: () => WishlistItemDto,
    isArray: true,
  })
  items!: WishlistItemDto[];
}
