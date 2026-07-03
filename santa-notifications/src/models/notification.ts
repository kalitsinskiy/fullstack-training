import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type NotificationType = 'room_invite' | 'assignment' | 'wishlist_update' | 'system';

interface NotificationRecord {
  userId: Types.ObjectId;
  type: NotificationType;
  payload?: unknown;
  message: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationRecord>({
  userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['room_invite', 'assignment', 'wishlist_update', 'system'],
    required: true,
  },
  payload: { type: Schema.Types.Mixed },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = HydratedDocument<NotificationRecord>;

export const NotificationModel = model<NotificationRecord>('Notification', notificationSchema);
