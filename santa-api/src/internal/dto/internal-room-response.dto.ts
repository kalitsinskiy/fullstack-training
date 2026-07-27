import { ApiProperty } from '@nestjs/swagger';

export class InternalRoomResponseDto {
  @ApiProperty({ example: '665f0c2ab7d13a5e8b1c4d2b' })
  id!: string;

  @ApiProperty({ example: 'Office Secret Santa' })
  name!: string;

  @ApiProperty({ type: [String], example: ['665f0c2ab7d13a5e8b1c4d9f'] })
  memberIds!: string[];
}
