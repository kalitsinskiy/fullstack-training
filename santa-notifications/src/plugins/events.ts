import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import amqp from 'amqplib';
import { Types } from 'mongoose';
import { NotificationModel, NotificationType } from '../models/notification';
import { getSantaApiClient } from '../services/santa-api-client';

interface NotificationInsert {
  userId?: Types.ObjectId;
  type: NotificationType;
  roomId?: string;
  message: string;
  messageId?: string;
}

const EXCHANGE = 'santa.events';
const QUEUE = 'notifications.events';
const DLX = 'santa.dlx';
const DLQ = 'santa.dlq';

const ROUTING_KEYS = ['room.created', 'user.joined', 'draw.completed', 'wishlist.updated'];

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

async function handleUserJoined(
  data: Record<string, unknown>,
  roomId: string,
  fastify: FastifyInstance
): Promise<NotificationInsert[]> {
  const client = getSantaApiClient(fastify.config.santaApiUrl, fastify.config.serviceApiKey);

  const [room, user] = await Promise.all([
    client.getRoomById(roomId),
    client.getUserById(data.userId as string),
  ]);

  return room.memberIds
    .filter((memberId) => memberId !== (data.userId as string))
    .map((memberId) => ({
      userId: toObjectId(memberId),
      type: 'user.joined' as NotificationType,
      roomId,
      message: `${user.displayName} joined "${room.name}"`,
    }));
}

async function handleDrawCompleted(
  data: Record<string, unknown>,
  roomId: string,
  fastify: FastifyInstance
): Promise<NotificationInsert[]> {
  const client = getSantaApiClient(fastify.config.santaApiUrl, fastify.config.serviceApiKey);
  const room = await client.getRoomById(roomId);
  const participantIds = (data.participantIds as string[] | undefined) ?? room.memberIds;

  return participantIds.map((userId) => ({
    userId: toObjectId(userId),
    type: 'draw.completed' as NotificationType,
    roomId,
    message: `The draw for "${room.name}" is done. Check who you got!`,
  }));
}

async function handleWishlistUpdated(
  data: Record<string, unknown>,
  roomId: string,
  fastify: FastifyInstance
): Promise<NotificationInsert[]> {
  const client = getSantaApiClient(fastify.config.santaApiUrl, fastify.config.serviceApiKey);

  const [room, user] = await Promise.all([
    client.getRoomById(roomId),
    client.getUserById(data.userId as string),
  ]);

  return room.memberIds
    .filter((memberId) => memberId !== (data.userId as string))
    .map((memberId) => ({
      userId: toObjectId(memberId),
      type: 'wishlist.updated' as NotificationType,
      roomId,
      message: `${user.displayName} updated their wishlist in "${room.name}"`,
    }));
}

async function buildNotifications(
  routingKey: string,
  data: Record<string, unknown>,
  fastify: FastifyInstance
): Promise<NotificationInsert[]> {
  const roomId = data.roomId as string | undefined;

  switch (routingKey) {
    case 'user.joined':
      if (roomId && data.userId) {
        try {
          return await handleUserJoined(data, roomId, fastify);
        } catch (err) {
          fastify.log.warn(
            { err, roomId },
            'Failed to enrich user.joined — falling back to generic'
          );
        }
      }
      return roomId
        ? [
            {
              type: 'user.joined',
              roomId,
              message: `${data.userName ?? 'Someone'} joined the room`,
            },
          ]
        : [];

    case 'draw.completed':
      if (roomId) {
        try {
          return await handleDrawCompleted(data, roomId, fastify);
        } catch (err) {
          fastify.log.warn(
            { err, roomId },
            'Failed to enrich draw.completed — falling back to generic'
          );
          const participantIds = data.participantIds as string[] | undefined;
          if (participantIds?.length) {
            return participantIds.map((userId) => ({
              userId: toObjectId(userId),
              type: 'draw.completed' as NotificationType,
              roomId,
              message: 'The Secret Santa draw is complete! Check your assignment.',
            }));
          }
        }
      }
      return roomId
        ? [
            {
              type: 'draw.completed',
              roomId,
              message: 'The draw is complete! Check your assignment',
            },
          ]
        : [];

    case 'wishlist.updated':
      if (roomId && data.userId) {
        try {
          return await handleWishlistUpdated(data, roomId, fastify);
        } catch (err) {
          fastify.log.warn(
            { err, roomId },
            'Failed to enrich wishlist.updated — falling back to generic'
          );
        }
      }
      return roomId
        ? [{ type: 'wishlist.updated', roomId, message: 'A wishlist was updated in your room' }]
        : [];

    case 'room.created':
      return roomId
        ? [{ type: 'room.created', roomId, message: `Room "${data.roomName}" was created` }]
        : [];

    default:
      return [];
  }
}

async function eventsPlugin(fastify: FastifyInstance) {
  const url = fastify.config.rabbitUrl;

  if (!url) {
    fastify.log.warn('RABBIT_URL not set — event consumer disabled');
    return;
  }

  let connection: amqp.ChannelModel;
  let channel: amqp.Channel;

  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Dead letter exchange and queue
    await channel.assertExchange(DLX, 'fanout', { durable: true });
    await channel.assertQueue(DLQ, { durable: true });
    await channel.bindQueue(DLQ, DLX, '');

    // Main exchange
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    // Main queue with DLQ config
    await channel.assertQueue(QUEUE, {
      durable: true,
      deadLetterExchange: DLX,
    });

    // Bind to all routing keys
    for (const key of ROUTING_KEYS) {
      await channel.bindQueue(QUEUE, EXCHANGE, key);
    }

    // Process one message at a time
    channel.prefetch(1);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      const messageId = msg.properties.messageId as string | undefined;

      try {
        const data = JSON.parse(msg.content.toString()) as Record<string, unknown>;

        // Idempotency check — only for single-notification events; fan-out events
        // are deduplicated by the compound (userId + roomId + type) compound key below.
        if (messageId) {
          const existing = await NotificationModel.findOne({ messageId }).exec();
          if (existing) {
            channel.ack(msg);
            return;
          }
        }

        const notifications = await buildNotifications(routingKey, data, fastify);

        if (notifications.length > 0) {
          // Stamp messageId only on single-notification events to preserve idempotency key.
          if (notifications.length === 1) {
            notifications[0].messageId = messageId;
          }
          await NotificationModel.insertMany(notifications, { ordered: false });
        }

        channel.ack(msg);
      } catch (err) {
        fastify.log.error(
          { err, routingKey, messageId },
          'Failed to process event — sending to DLQ'
        );
        channel.nack(msg, false, false);
      }
    });

    fastify.log.info('RabbitMQ consumer connected and listening');
  } catch (err) {
    fastify.log.error({ err }, 'Failed to connect to RabbitMQ — event consumer disabled');
    return;
  }

  fastify.addHook('onClose', async () => {
    try {
      await channel?.close();
      await connection?.close();
    } catch {
      // ignore close errors on shutdown
    }
  });
}

export default fp(eventsPlugin, { name: 'events', dependencies: ['config'] });
