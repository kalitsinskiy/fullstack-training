import type { Channel, ConsumeMessage } from 'amqplib';
import { NotificationModel, NotificationType } from '../models/notification';
import { buildNotificationMessage } from './messages';
import type { SantaApiClient, RoomDetails } from '../services/santa-api-client';

export function resolveRecipients(
  routingKey: NotificationType,
  data: Record<string, unknown>,
  room: RoomDetails
): string[] {
  const actor = data.userId as string | undefined;

  switch (routingKey) {
    case 'user.joined':
    case 'wishlist.updated':
      return room.memberIds.filter((id) => id !== actor);
      break;

    case 'draw.completed':
      return room.memberIds;

    case 'room.created':
      return [data.createdBy as string].filter(Boolean) as string[];

    default:
      return [];
  }
}

export async function handleMessage(
  channel: Channel,
  msg: ConsumeMessage | null,
  client: SantaApiClient
): Promise<void> {
  if (!msg) return;

  try {
    const routingKey = msg.fields.routingKey as NotificationType;
    const messageId = msg.properties.messageId as string | undefined;
    const data = JSON.parse(msg.content.toString()) as Record<string, unknown>;

    if (messageId) {
      const existing = await NotificationModel.findOne({ messageId }).lean();

      if (existing) {
        channel.ack(msg);
        return;
      }
    }

    const roomId = data.roomId as string | undefined;

    if (!roomId) {
      channel.ack(msg);
      return;
    }

    const room = await client.getRoomById(roomId);
    const recipients = resolveRecipients(routingKey, data, room);
    const message = buildNotificationMessage(routingKey, data, room.name);

    if (recipients.length > 0) {
      await NotificationModel.insertMany(
        recipients.map((userId) => ({ userId, roomId, type: routingKey, message, messageId }))
      );
    }

    channel.ack(msg);
  } catch {
    channel.nack(msg, false, false);
  }
}
