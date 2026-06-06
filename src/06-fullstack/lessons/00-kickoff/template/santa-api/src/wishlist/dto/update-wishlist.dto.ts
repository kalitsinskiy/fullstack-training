import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, Length } from 'class-validator';

export class UpdateWishlistDto {
  @ApiProperty({
    description: 'Wishlist items that replace the current wishlist (one string per item)',
    type: String,
    isArray: true,
    example: ['Wool socks', 'A good book', 'Coffee beans'],
  })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  items!: string[];
}
