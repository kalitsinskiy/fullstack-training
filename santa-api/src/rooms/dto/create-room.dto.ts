import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    example: 'Office Secret Santa 2024',
    description: 'Room name (min 3 chars)',
  })
  @IsString()
  @MinLength(3, { message: 'Room name must be at least 3 characters long' })
  name!: string;
}
