import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  inviteCode!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participants!: Types.ObjectId[];

  @Prop({ enum: ['pending', 'drawn'], default: 'pending' })
  status!: 'pending' | 'drawn';

  @Prop()
  drawDate?: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// Convert _id -> id and remove __v when serializing
RoomSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString?.() || ret.id;
    // convert ObjectId arrays to strings
    if (Array.isArray(ret.participants)) {
      ret.participants = ret.participants.map((p) => p?.toString?.());
    }
    if (ret.creatorId) ret.creatorId = ret.creatorId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
