import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateRoomDto {
  @ApiProperty({
    description: 'New room name',
    example: 'New Year team building',
    minLength: 3,
    maxLength: 60,
  })
  @IsString()
  @Length(3, 60)
  name!: string;
}
