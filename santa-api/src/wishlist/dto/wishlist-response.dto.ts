import { ApiProperty } from '@nestjs/swagger';
import { WishlistItemDto } from './update-wishlist.dto';

export class WishlistResponseDto {
  @ApiProperty({ example: '6a1959b19080f995c722c00d' })
  roomId!: string;

  @ApiProperty({ example: '6a15a51b445eec80c0113052' })
  userId!: string;

  @ApiProperty({
    example: 'Alice',
    description: "Display name of the wishlist's owner.",
  })
  userName!: string;

  @ApiProperty({ type: [WishlistItemDto] })
  items!: WishlistItemDto[];
}
