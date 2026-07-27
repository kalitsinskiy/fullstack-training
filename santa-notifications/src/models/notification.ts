import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type NotificationType =
  | 'room_invite'
  | 'assignment'
  | 'wishlist_update'
  | 'system'
  | 'room.created'
  | 'user.joined'
  | 'draw.completed'
  | 'wishlist.updated';

export const notificationTypes: NotificationType[] = [
  'room_invite',
  'assignment',
  'wishlist_update',
  'system',
  'room.created',
  'user.joined',
  'draw.completed',
  'wishlist.updated',
];

interface NotificationRecord {
  userId?: Types.ObjectId | null;
  roomId?: Types.ObjectId | null;
  type: NotificationType;
  payload?: unknown;
  message: string;
  read: boolean;
  messageId?: string | null;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationRecord>({
  userId: { type: Types.ObjectId, ref: 'User', required: false, index: true },
  roomId: { type: Types.ObjectId, required: false, index: true },
  type: {
    type: String,
    enum: notificationTypes,
    required: true,
  },
  payload: { type: Schema.Types.Mixed },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  messageId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ messageId: 1 }, { unique: true, sparse: true });

export type NotificationDocument = HydratedDocument<NotificationRecord>;

export const NotificationModel = model<NotificationRecord>('Notification', notificationSchema);
