import type { Channel, ConsumeMessage } from 'amqplib';
import { NotificationModel, NotificationType } from '../models/notification';
import { buildNotificationMessage } from './messages';
import type { SantaApiClient, RoomDetails } from '../services/santa-api-client';
import { Server } from 'socket.io';

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

    case 'room.date_changed':
      return room.memberIds;

    default:
      return [];
  }
}

export function roomEventFor(
  routingKey: NotificationType,
  roomId: string,
  data: Record<string, unknown>
): { event: string; payload: Record<string, unknown> } | null {
  switch (routingKey) {
    case 'user.joined':
      return { event: 'room:member-joined', payload: { roomId, userId: data.userId } };

    case 'draw.completed':
      return { event: 'room:draw-completed', payload: { roomId } };

    case 'room.date_changed':
      return { event: 'room:date-changed', payload: { roomId } };

    default:
      return null;
  }
}

export async function handleMessage(
  channel: Channel,
  msg: ConsumeMessage | null,
  client: SantaApiClient,
  io: Server | null
): Promise<void> {
  if (!msg) return;

  try {
    const routingKey = msg.fields.routingKey as NotificationType;
    const messageId = msg.properties.messageId as string;
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

    const room: RoomDetails = await client.getRoomById(roomId);
    const recipients = resolveRecipients(routingKey, data, room);
    const message = buildNotificationMessage(routingKey, data, room.name);

    if (recipients.length > 0) {
      const docs = await NotificationModel.insertMany(
        recipients.map((userId) => ({ userId, roomId, type: routingKey, message, messageId }))
      );

      for (const doc of docs) {
        io?.to(`user:${doc.userId.toString()}`).emit('notification', {
          id: doc._id.toString(),
          userId: doc.userId.toString(),
          roomId,
          type: doc.type,
          message: doc.message,
          read: doc.read,
          createdAt: doc.createdAt.toISOString(),
        });
      }
    }

    const roomEvent = roomEventFor(routingKey, roomId, data);
    if (roomEvent) {
      io?.to(`room:${roomId}`).emit(roomEvent.event, roomEvent.payload);
    }

    channel.ack(msg);
  } catch {
    channel.nack(msg, false, false);
  }
}
