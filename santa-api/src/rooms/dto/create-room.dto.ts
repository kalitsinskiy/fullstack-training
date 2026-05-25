import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export default class CreateRoomDto {
  @ApiProperty({
    description: 'The name of the room',
    example: 'Family Secret Santa 2024',
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'The ID of the owner of the room',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(30)
  ownerId: string;
}
