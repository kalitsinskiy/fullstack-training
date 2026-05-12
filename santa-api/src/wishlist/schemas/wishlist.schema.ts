import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WishlistDocument = HydratedDocument<Wishlist>;

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
