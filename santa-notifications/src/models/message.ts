import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: string;
  recipientId: string;
  roomId: string;
  text: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

MessageSchema.index({ recipientId: 1, roomId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, roomId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
