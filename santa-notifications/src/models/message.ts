import { HydratedDocument, Schema, model } from 'mongoose';

// Anonymous message between a Secret Santa and their giftee. senderId is stored
// for moderation/abuse/auditing but is NEVER returned to the recipient — see
// routes/messages.ts (the `senderId: 0` projection is the privacy safeguard).
interface MessageRecord {
  senderId: string;
  recipientId: string;
  roomId: string;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<MessageRecord>({
  senderId: { type: String, required: true, index: true },
  recipientId: { type: String, required: true, index: true },
  roomId: { type: String, required: true, index: true },
  text: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

// Listing a user's received messages in a room, newest-first.
messageSchema.index({ recipientId: 1, roomId: 1, createdAt: -1 });
// Listing a user's sent messages in a room (the "outgoing" side of the thread).
messageSchema.index({ senderId: 1, roomId: 1, createdAt: -1 });

export type MessageDocument = HydratedDocument<MessageRecord>;

export const MessageModel = model<MessageRecord>('Message', messageSchema);
