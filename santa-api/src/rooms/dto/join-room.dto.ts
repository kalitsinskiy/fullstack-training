import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export default class JoinRoomDto {
  @ApiProperty({
    description: 'The ID of the user joining the room',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;
}
