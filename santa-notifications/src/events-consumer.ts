import * as amqp from 'amqplib';
import { FastifyBaseLogger } from 'fastify';
import type { Server as IOServer } from 'socket.io';
import { NotificationModel, NotificationType } from './models/notification';
import { SantaApiClient } from './services/santa-api-client';

const EXCHANGE = 'santa.events';
const QUEUE = 'notifications.events';
const DLX = 'santa.dlx';
const DLQ = 'santa.dlq';
const ROUTING_KEYS = [
  'room.created',
  'user.joined',
  'draw.completed',
  'wishlist.updated',
  'room.date_changed',
];

interface EventData {
  roomId?: string;
  roomName?: string;
  userId?: string;
  createdBy?: string;
  exchangeDate?: string;
  changedBy?: string;
}

interface NotificationSpec {
  userId: string;
  roomId?: string;
  type: NotificationType;
  message: string;
}

// Enrich the event via santa-api (sync HTTP) and fan out one notification per
// recipient. Throws on enrichment failure → message is nacked to the DLQ.
async function buildNotifications(
  routingKey: string,
  data: EventData,
  api: SantaApiClient,
): Promise<NotificationSpec[]> {
  switch (routingKey) {
    case 'room.created':
      // No notification: the creator is the only member at creation time, so
      // there's no one else to notify, and notifying them about their own action
      // just duplicates the app's local "Room created" toast.
      return [];

    case 'user.joined': {
      const [room, user] = await Promise.all([
        api.getRoomById(data.roomId!),
        api.getUserById(data.userId!),
      ]);
      // Notify everyone already in the room except the person who joined.
      return room.memberIds
        .filter((m) => m !== data.userId)
        .map((m) => ({
          userId: m,
          roomId: room.id,
          type: 'system' as const,
          message: `${user.displayName} joined "${room.name}"`,
        }));
    }

    case 'draw.completed': {
      const room = await api.getRoomById(data.roomId!);
      return room.memberIds.map((m) => ({
        userId: m,
        roomId: room.id,
        type: 'assignment' as const,
        message: `The draw for "${room.name}" is complete — check your giftee!`,
      }));
    }

    case 'wishlist.updated': {
      const room = await api.getRoomById(data.roomId!);
      return room.memberIds
        .filter((m) => m !== data.userId)
        .map((m) => ({
          userId: m,
          roomId: room.id,
          type: 'wishlist_update' as const,
          message: `A wishlist was updated in "${room.name}"`,
        }));
    }

    case 'room.date_changed': {
      const room = await api.getRoomById(data.roomId!);
      const when = data.exchangeDate
        ? new Date(data.exchangeDate).toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'a new date';
      // Everyone is affected by a date change — except the owner who made it
      // (they already saw local confirmation).
      return room.memberIds
        .filter((m) => m !== data.changedBy)
        .map((m) => ({
          userId: m,
          roomId: room.id,
          type: 'system' as const,
          message: `The gift exchange for "${room.name}" is now ${when}`,
        }));
    }

    default:
      return [];
  }
}

export async function startEventConsumer(
  rabbitUrl: string,
  api: SantaApiClient,
  io: IOServer,
  log: FastifyBaseLogger,
): Promise<() => Promise<void>> {
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(DLX, 'fanout', { durable: true });
  await channel.assertQueue(DLQ, { durable: true });
  await channel.bindQueue(DLQ, DLX, '');

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE, { durable: true, deadLetterExchange: DLX });
  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE, EXCHANGE, key);
  }
  await channel.prefetch(10);

  await channel.consume(QUEUE, (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    void (async () => {
      try {
        const routingKey = msg.fields.routingKey;
        const data = JSON.parse(msg.content.toString()) as EventData;
        const messageId = msg.properties.messageId as string | undefined;

        const specs = await buildNotifications(routingKey, data, api);
        for (const spec of specs) {
          // Idempotency is per recipient (one event fans out to many users).
          const perUserId = messageId ? `${messageId}:${spec.userId}` : undefined;
          if (perUserId) {
            const existing = await NotificationModel.findOne({
              messageId: perUserId,
            });
            if (existing) continue;
          }
          const created = await NotificationModel.create({
            ...spec,
            messageId: perUserId,
          });
          // Real-time push to the recipient's personal room (instant bell/toast).
          io.to(`user:${spec.userId}`).emit('notification', {
            id: created._id.toString(),
            type: created.type,
            message: created.message,
            roomId: spec.roomId ?? null,
            read: false,
            createdAt: created.createdAt.toISOString(),
          });
        }
        // Room-level broadcast so open RoomDetailPages refresh live.
        if (data.roomId) {
          if (routingKey === 'user.joined') {
            io.to(`room:${data.roomId}`).emit('room:member-joined', {
              roomId: data.roomId,
              userId: data.userId,
            });
          } else if (routingKey === 'draw.completed') {
            io.to(`room:${data.roomId}`).emit('room:draw-completed', {
              roomId: data.roomId,
            });
          } else if (routingKey === 'room.date_changed') {
            io.to(`room:${data.roomId}`).emit('room:updated', {
              roomId: data.roomId,
            });
          }
        }
        channel.ack(msg);
        log.info(
          { routingKey, count: specs.length },
          'Notifications created from event',
        );
      } catch (err) {
        log.error({ err }, 'Failed to process event; dead-lettering');
        channel.nack(msg, false, false);
      }
    })();
  });

  log.info('RabbitMQ consumer started');
  return async () => {
    await channel.close();
    await connection.close();
  };
}
