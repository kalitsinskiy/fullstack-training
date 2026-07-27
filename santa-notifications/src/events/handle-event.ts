import { NotificationModel, NotificationType, notificationTypes } from '../models/notification';
import type { RoomDetails, SantaApi } from '../services/santa-api-client';

export interface EventPayload {
  roomId?: string;
  roomName?: string;
  userId?: string;
  userName?: string;
  participantCount?: number;
  createdBy?: string;
}

interface PlannedNotification {
  userId: string;
  type: NotificationType;
  message: string;
  roomId?: string;
}

export interface HandleEventDeps {
  api: SantaApi;
}

export interface HandleEventResult {
  status: 'created' | 'duplicate' | 'skipped';
  created: number;
}

export function buildNotificationMessage(
  routingKey: string,
  data: EventPayload,
  roomName?: string
): string {
  const room = roomName ?? data.roomName ?? 'your room';

  switch (routingKey) {
    case 'room.created':
      return `Room "${room}" was created`;
    case 'user.joined':
      return `${data.userName ?? 'Someone'} joined "${room}"`;
    case 'draw.completed':
      return `The draw for "${room}" is complete — check your giftee!`;
    case 'wishlist.updated':
      return `A wishlist was updated in "${room}"`;
    default:
      return `New event: ${routingKey}`;
  }
}

function isKnownType(routingKey: string): routingKey is NotificationType {
  return (notificationTypes as string[]).includes(routingKey);
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000
  );
}

function recipientsFor(
  routingKey: NotificationType,
  room: RoomDetails,
  data: EventPayload
): string[] {
  switch (routingKey) {
    case 'room.created':
    case 'draw.completed':
      return room.memberIds;
    case 'user.joined':
      return room.memberIds.filter((memberId) => memberId !== data.userId);
    case 'wishlist.updated':
      return room.memberIds.filter((memberId) => memberId !== data.userId);
    default:
      return [];
  }
}

export async function handleEvent(
  routingKey: string,
  data: EventPayload,
  messageId: string | undefined,
  deps: HandleEventDeps
): Promise<HandleEventResult> {
  if (!isKnownType(routingKey)) {
    throw new Error(`Unsupported routing key: ${routingKey}`);
  }

  if (!data.roomId) {
    throw new Error(`Event ${routingKey} is missing roomId`);
  }

  if (messageId) {
    const existing = await NotificationModel.exists({ messageId });
    if (existing) return { status: 'duplicate', created: 0 };
  }

  const room = await deps.api.getRoomById(data.roomId);

  const userName =
    data.userName ??
    (routingKey === 'user.joined' && data.userId
      ? (await deps.api.getUserById(data.userId)).displayName
      : undefined);

  const message = buildNotificationMessage(routingKey, { ...data, userName }, room.name);
  const planned: PlannedNotification[] = recipientsFor(routingKey, room, data).map((userId) => ({
    userId,
    type: routingKey,
    message,
    roomId: data.roomId,
  }));

  if (planned.length === 0) {
    return { status: 'skipped', created: 0 };
  }

  try {
    const inserted = await NotificationModel.insertMany(
      planned.map((notification) => ({
        ...notification,
        payload: data,
        read: false,
        ...(messageId ? { messageId } : {}),
      })),
      { ordered: false }
    );
    return { status: 'created', created: inserted.length };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const inserted = (error as { insertedDocs?: unknown[] }).insertedDocs ?? [];
      return {
        status: inserted.length > 0 ? 'created' : 'duplicate',
        created: inserted.length,
      };
    }
    throw error;
  }
}
