import { Types } from 'mongoose';

export class RoomResponseDto {
  id: string;
  name: string;
  creatorId: string;
  inviteCode: string;
  participants: string[];
  status: 'pending' | 'drawn';
  drawDate?: Date;
  createdAt: Date;
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
