import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  roomId!: Types.ObjectId;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        url: { type: String },
        priority: { type: Number },
      },
    ],
    default: [],
  })
  items!: Array<{ name: string; url?: string; priority?: number }>;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Compound unique index — one wishlist per (user, room)
WishlistSchema.index({ userId: 1, roomId: 1 }, { unique: true });

// Convert _id -> id and remove __v when serializing
WishlistSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString?.() || ret.id;
    if (ret.userId) ret.userId = ret.userId.toString();
    if (ret.roomId) ret.roomId = ret.roomId.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
