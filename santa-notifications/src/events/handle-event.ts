import { NotificationModel, NotificationType, notificationTypes } from '../models/notification';

export interface EventPayload {
  roomId?: string;
  roomName?: string;
  userId?: string;
  userName?: string;
  participantCount?: number;
}

export function buildNotificationMessage(routingKey: string, data: EventPayload): string {
  switch (routingKey) {
    case 'room.created':
      return `Room "${data.roomName}" was created`;
    case 'user.joined':
      return `${data.userName} joined the room`;
    case 'draw.completed':
      return 'The draw is complete! Check your assignment';
    case 'wishlist.updated':
      return 'A wishlist was updated in your room';
    default:
      return `New event: ${routingKey}`;
  }
}

export type HandleEventResult = 'created' | 'duplicate';

function isKnownType(routingKey: string): routingKey is NotificationType {
  return (notificationTypes as string[]).includes(routingKey);
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000
  );
}

export async function handleEvent(
  routingKey: string,
  data: EventPayload,
  messageId?: string
): Promise<HandleEventResult> {
  if (!isKnownType(routingKey)) {
    throw new Error(`Unsupported routing key: ${routingKey}`);
  }

  if (messageId) {
    const existing = await NotificationModel.findOne({ messageId }).exec();
    if (existing) return 'duplicate';
  }

  try {
    await NotificationModel.create({
      type: routingKey,
      message: buildNotificationMessage(routingKey, data),
      payload: data,
      read: false,
      ...(data.roomId ? { roomId: data.roomId } : {}),
      ...(messageId ? { messageId } : {}),
    });
    return 'created';
  } catch (error) {
    if (isDuplicateKeyError(error)) return 'duplicate';
    throw error;
  }
}
