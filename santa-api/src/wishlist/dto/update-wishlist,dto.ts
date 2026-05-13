import { IsArray, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateWishlistDto {
  @IsUUID()
  userId!: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  items!: string[];
}
