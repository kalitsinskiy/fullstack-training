import * as amqp from 'amqplib';
import type { Server as SocketServer } from 'socket.io';
import { NotificationModel, NotificationType } from './models/notification';
import { getSantaApiClient } from './services/santa-api-client';

const EXCHANGE = 'santa.events';
const DLX = 'santa.dlx';
const DLQ = 'santa.dlq';
const QUEUE = 'notifications.events';

const ROUTING_KEYS = ['room.created', 'user.joined', 'draw.completed', 'wishlist.updated'];

interface RoomCreatedEvent {
  roomId: string;
  roomName: string;
  createdBy: string;
}

interface UserJoinedEvent {
  roomId: string;
  userId: string;
  userName: string;
}

interface DrawCompletedEvent {
  roomId: string;
  participants: string[];
}

interface WishlistUpdatedEvent {
  roomId: string;
  userId: string;
}

async function handleRoomCreated(
  data: RoomCreatedEvent,
  io: SocketServer,
  messageId?: string,
): Promise<void> {
  const key = messageId ? `${messageId}:${data.createdBy}` : undefined;
  if (key) {
    const exists = await NotificationModel.findOne({ messageId: key }).lean().exec();
    if (exists) return;
  }

  const notification = await NotificationModel.create({
    userId: data.createdBy,
    type: 'room.created' as NotificationType,
    roomId: data.roomId,
    message: `Your room "${data.roomName}" was created successfully`,
    messageId: key,
    read: false,
  });

  io.to(`user:${data.createdBy}`).emit('notification', {
    id: notification._id,
    type: notification.type,
    message: notification.message,
    roomId: notification.roomId,
    createdAt: notification.createdAt,
  });
}

async function handleUserJoined(
  data: UserJoinedEvent,
  io: SocketServer,
  messageId?: string,
): Promise<void> {
  const client = getSantaApiClient();
  const room = await client.getRoomById(data.roomId);

  const recipients = room.memberIds.filter((id) => id !== data.userId);
  if (recipients.length === 0) return;

  const docs = recipients.map((userId) => ({
    userId,
    type: 'user.joined' as NotificationType,
    roomId: data.roomId,
    message: `${data.userName} joined "${room.name}"`,
    messageId: messageId ? `${messageId}:${userId}` : undefined,
    read: false,
  }));

  for (const doc of docs) {
    const key = doc.messageId;
    if (key) {
      const exists = await NotificationModel.findOne({ messageId: key }).lean().exec();
      if (exists) continue;
    }
    const notification = await NotificationModel.create(doc);

    io.to(`user:${doc.userId}`).emit('notification', {
      id: notification._id,
      type: notification.type,
      message: notification.message,
      roomId: notification.roomId,
      createdAt: notification.createdAt,
    });
  }

  io.to(`room:${data.roomId}`).emit('room:member-joined', {
    roomId: data.roomId,
    userId: data.userId,
  });
}

async function handleDrawCompleted(
  data: DrawCompletedEvent,
  io: SocketServer,
  messageId?: string,
): Promise<void> {
  const client = getSantaApiClient();
  const room = await client.getRoomById(data.roomId);

  const participants = data.participants ?? room.memberIds;

  const docs = participants.map((userId) => ({
    userId,
    type: 'draw.completed' as NotificationType,
    roomId: data.roomId,
    message: `The draw for "${room.name}" is complete! Check who you got.`,
    messageId: messageId ? `${messageId}:${userId}` : undefined,
    read: false,
  }));

  for (const doc of docs) {
    const key = doc.messageId;
    if (key) {
      const exists = await NotificationModel.findOne({ messageId: key }).lean().exec();
      if (exists) continue;
    }
    const notification = await NotificationModel.create(doc);

    io.to(`user:${doc.userId}`).emit('notification', {
      id: notification._id,
      type: notification.type,
      message: notification.message,
      roomId: notification.roomId,
      createdAt: notification.createdAt,
    });
  }

  io.to(`room:${data.roomId}`).emit('room:draw-completed', {
    roomId: data.roomId,
  });
}

async function handleWishlistUpdated(
  data: WishlistUpdatedEvent,
  io: SocketServer,
  messageId?: string,
): Promise<void> {
  const client = getSantaApiClient();
  const room = await client.getRoomById(data.roomId);

  const recipients = room.memberIds.filter((id) => id !== data.userId);
  if (recipients.length === 0) return;

  let updaterName = data.userId;
  try {
    const user = await client.getUserById(data.userId);
    updaterName = user.displayName;
  } catch {
    // non-fatal: fall back to raw userId
  }

  const docs = recipients.map((userId) => ({
    userId,
    type: 'wishlist.updated' as NotificationType,
    roomId: data.roomId,
    message: `${updaterName} updated their wishlist in "${room.name}"`,
    messageId: messageId ? `${messageId}:${userId}` : undefined,
    read: false,
  }));

  for (const doc of docs) {
    const key = doc.messageId;
    if (key) {
      const exists = await NotificationModel.findOne({ messageId: key }).lean().exec();
      if (exists) continue;
    }
    const notification = await NotificationModel.create(doc);

    io.to(`user:${doc.userId}`).emit('notification', {
      id: notification._id,
      type: notification.type,
      message: notification.message,
      roomId: notification.roomId,
      createdAt: notification.createdAt,
    });
  }
}

export async function startConsumer(
  rabbitmqUrl: string,
  io: SocketServer,
  log: (msg: string) => void,
): Promise<void> {
  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(DLX, 'fanout', { durable: true });
  await channel.assertQueue(DLQ, { durable: true });
  await channel.bindQueue(DLQ, DLX, '');

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE, { durable: true, deadLetterExchange: DLX });

  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE, EXCHANGE, key);
  }

  await channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const routingKey = msg.fields.routingKey;
      const data = JSON.parse(msg.content.toString()) as Record<string, unknown>;
      const messageId = msg.properties.messageId as string | undefined;

      switch (routingKey) {
        case 'room.created':
          await handleRoomCreated(data as unknown as RoomCreatedEvent, io, messageId);
          break;
        case 'user.joined':
          await handleUserJoined(data as unknown as UserJoinedEvent, io, messageId);
          break;
        case 'draw.completed':
          await handleDrawCompleted(data as unknown as DrawCompletedEvent, io, messageId);
          break;
        case 'wishlist.updated':
          await handleWishlistUpdated(data as unknown as WishlistUpdatedEvent, io, messageId);
          break;
        default:
          log(`Unhandled routing key: ${routingKey}`);
      }

      log(`Processed event: ${routingKey}`);
      channel.ack(msg);
    } catch (error) {
      log(`Failed to process RabbitMQ message: ${error instanceof Error ? error.message : String(error)}`);
      channel.nack(msg, false, false);
    }
  });

  log(`RabbitMQ consumer started, listening on queue "${QUEUE}"`);

  process.on('SIGTERM', async () => {
    await channel.close();
    await connection.close();
  });
}
