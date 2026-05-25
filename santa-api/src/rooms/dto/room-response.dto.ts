import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class RoomResponseDto {
  @ApiProperty({
    description: 'The ID of the room',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the room',
    example: 'Family Secret Santa 2024',
  })
  name: string;

  @ApiProperty({
    description: 'The ID of the creator of the room',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  creatorId: string;

  @ApiProperty({
    description: 'The invite code for the room',
    example: 'ABCDE',
  })
  inviteCode: string;

  @ApiProperty({
    description: 'The list of participants in the room',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  participants: string[];

  @ApiProperty({
    description: 'The status of the room',
    example: 'pending',
  })
  status: 'pending' | 'drawn';

  @ApiProperty({
    description: 'The date of the draw',
    example: '2024-12-25T00:00:00.000Z',
    required: false,
  })
  drawDate?: Date;

  @ApiProperty({
    description: 'The date the room was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date the room was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(data: {
    _id?: Types.ObjectId;
    id?: string;
    name: string;
    creatorId: Types.ObjectId;
    inviteCode: string;
    participants: Types.ObjectId[];
    status: 'pending' | 'drawn';
    drawDate?: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const idValue = (data.id || data._id)?.toString() || '';
    this.id = idValue;
    this.name = data.name;
    this.creatorId = data.creatorId.toString();
    this.inviteCode = data.inviteCode;
    this.participants = data.participants.map((p) => p.toString());
    this.status = data.status;
    this.drawDate = data.drawDate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
