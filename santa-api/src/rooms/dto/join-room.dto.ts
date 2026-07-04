import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    description: 'Invite code that authorises joining the room',
    example: 'Q7X4LM',
  })
  @IsString()
  @Length(6, 6)
  inviteCode!: string;
}
