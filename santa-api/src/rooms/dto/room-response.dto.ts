import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomResponseDto {
  @ApiProperty({
    description: 'Room identifier',
    example: '665f0c2ab7d13a5e8b1c4d9f',
  })
  id!: string;

  @ApiProperty({
    description: 'Readable room name',
    example: 'New Year team building',
  })
  name!: string;

  @ApiProperty({
    description: 'Owner user identifier',
    example: '665f0c2ab7d13a5e8b1c4d1a',
  })
  ownerId!: string;

  @ApiProperty({
    description: 'Invite code used to join the room',
    example: 'Q7X4LM',
  })
  code!: string;

  @ApiProperty({
    description: 'Identifiers of all room members',
    example: ['665f0c2ab7d13a5e8b1c4d1a', '665f0c2ab7d13a5e8b1c4d1b'],
    type: String,
    isArray: true,
  })
  members!: string[];

  @ApiProperty({
    description: 'Current room status',
    enum: ['pending', 'drawn'],
    example: 'pending',
  })
  status!: 'pending' | 'drawn';

  @ApiPropertyOptional({
    description: 'ISO date when the draw is scheduled or completed',
    example: '2025-12-20T00:00:00.000Z',
  })
  drawDate?: string;
}
