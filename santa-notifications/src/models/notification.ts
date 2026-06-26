import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type NotificationType = 'room_invite' | 'assignment' | 'wishlist_update' | 'system';

interface NotificationRecord {
  // Optional: event-driven notifications (Lesson 06) can be room-scoped with no
  // single target user.
  userId?: Types.ObjectId;
  roomId?: Types.ObjectId;
  type: NotificationType;
  payload?: unknown;
  message: string;
  read: boolean;
  // RabbitMQ messageId — for idempotent consumption (Lesson 06).
  messageId?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationRecord>({
  userId: { type: Types.ObjectId, ref: 'User', index: true },
  roomId: { type: Types.ObjectId, ref: 'Room' },
  type: {
    type: String,
    enum: ['room_invite', 'assignment', 'wishlist_update', 'system'],
    required: true,
  },
  payload: { type: Schema.Types.Mixed },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  messageId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = HydratedDocument<NotificationRecord>;

export const NotificationModel = model<NotificationRecord>('Notification', notificationSchema);
