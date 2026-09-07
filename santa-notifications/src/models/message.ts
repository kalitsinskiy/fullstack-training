import { HydratedDocument, Schema, Types, model } from 'mongoose';

export const REACTIONS = ['👍', '👎', '🎁', '❤️', '😂', '🎉', '💩'];
export type Reaction = (typeof REACTIONS)[number];

interface MessageRecord {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  roomId: Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
  senderReaction?: Reaction;
  recipientReaction?: Reaction;
}

const messageSchema = new Schema<MessageRecord>({
  senderId: { type: Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Types.ObjectId, ref: 'User', required: true },
  roomId: { type: Types.ObjectId, ref: 'Room', required: true },
  text: { type: String, required: true, maxLength: 500 },
  read: { type: Boolean, default: false },
  senderReaction: { type: String, enum: REACTIONS },
  recipientReaction: { type: String, enum: REACTIONS },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ roomId: 1, senderId: 1, createdAt: 1 });
messageSchema.index({ roomId: 1, recipientId: 1, createdAt: 1 });
messageSchema.index({ recipientId: 1, read: 1 });

export type MessageDocument = HydratedDocument<MessageRecord>;
export const MessageModel = model<MessageRecord>('Message', messageSchema);
