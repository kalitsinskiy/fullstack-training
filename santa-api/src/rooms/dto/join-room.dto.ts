import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiProperty({ example: 'abc123', description: 'Room invite code' })
  @IsUUID()
  userId: string;
}
