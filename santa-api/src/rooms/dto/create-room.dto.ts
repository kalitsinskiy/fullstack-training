import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsUUID()
  ownerId!: string;
}
