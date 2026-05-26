import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({
    example: 'Office Secret Santa',
    description: 'Room name (min 3 characters)',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;
}
