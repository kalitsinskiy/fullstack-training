import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type MessageThread = 'giftee' | 'santa';

export type MessageDirection = 'in' | 'out';

export const MAX_MESSAGE_LENGTH = 500;

interface MessageRecord {
  senderId: string;
  recipientId: string;
  roomId: string;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<MessageRecord>(
  {
    senderId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    text: { type: String, required: true, maxlength: MAX_MESSAGE_LENGTH },
  },
  { timestamps: true }
);

messageSchema.index({ recipientId: 1, roomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, roomId: 1, createdAt: -1 });

export type MessageDocument = HydratedDocument<MessageRecord>;

type StoredMessage = Omit<MessageRecord, 'recipientId'> & { _id: Types.ObjectId };

export const MessageModel = model<MessageRecord>('Message', messageSchema);

export interface MessageDto {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  direction: MessageDirection;
}

export function toMessageDto(message: StoredMessage, viewerId: string): MessageDto {
  return {
    id: message._id.toString(),
    roomId: message.roomId,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
    direction: message.senderId === viewerId ? 'out' : 'in',
  };
}

export function mirrorThread(thread: MessageThread): MessageThread {
  return thread === 'giftee' ? 'santa' : 'giftee';
}
