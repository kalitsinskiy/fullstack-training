import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type NotificationType =
  | 'room.created'
  | 'user.joined'
  | 'draw.completed'
  | 'wishlist.updated';

interface NotificationRecord {
  userId?: Types.ObjectId;
  roomId?: string;
  type: NotificationType;
  payload?: unknown;
  message: string;
  read: boolean;
  messageId?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationRecord>({
  userId: { type: Types.ObjectId, ref: 'User', required: false, index: true },
  roomId: { type: String },
  type: {
    type: String,
    enum: ['room.created', 'user.joined', 'draw.completed', 'wishlist.updated'],
    required: true,
  },
  payload: { type: Schema.Types.Mixed },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  messageId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index(
  { messageId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { messageId: { $exists: true, $ne: null } } },
);

export type NotificationDocument = HydratedDocument<NotificationRecord>;

export const NotificationModel = model<NotificationRecord>('Notification', notificationSchema);
