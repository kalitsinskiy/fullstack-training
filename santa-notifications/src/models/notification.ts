import { Schema, model, Types } from 'mongoose';

const notificationSchema = new Schema({
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

export const NotificationModel = model('Notification', notificationSchema);
