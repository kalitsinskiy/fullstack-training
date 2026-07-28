import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type NotificationType =
  | 'room.created'
  | 'user.joined'
  | 'draw.completed'
  | 'wishlist.updated'
  | 'room.date_changed';

interface NotificationRecord {
  userId?: Types.ObjectId;
  roomId?: Types.ObjectId;
  type: NotificationType;
  payload?: unknown;
  message: string;
  read: boolean;
  messageId?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationRecord>({
  userId: { type: Types.ObjectId, ref: 'User', required: false, index: true },
  roomId: { type: Types.ObjectId, ref: 'Room' },
  type: {
    type: String,
    enum: [
      'room.created',
      'user.joined',
      'draw.completed',
      'wishlist.updated',
      'room.date_changed',
    ],
    required: true,
  },
  payload: { type: Schema.Types.Mixed },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  messageId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ messageId: 1 });

export type NotificationDocument = HydratedDocument<NotificationRecord>;

export const NotificationModel = model<NotificationRecord>('Notification', notificationSchema);
