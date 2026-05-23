import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;
}
