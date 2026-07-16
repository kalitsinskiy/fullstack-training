import * as amqp from 'amqplib';
import { NotificationModel } from './models/notification';

const EXCHANGE = 'santa.events';
const DLX = 'santa.dlx';
const DLQ = 'santa.dlq';
const QUEUE = 'notifications.events';

const ROUTING_KEYS = ['room.created', 'user.joined', 'draw.completed', 'wishlist.updated'];

function buildMessage(routingKey: string, data: Record<string, unknown>): string {
  switch (routingKey) {
    case 'room.created':
      return `Room "${data.roomName}" was created`;
    case 'user.joined':
      return `${data.userName} joined the room`;
    case 'draw.completed':
      return `The draw is complete! Check your assignment`;
    case 'wishlist.updated':
      return `A wishlist was updated in your room`;
    default:
      return `New event: ${routingKey}`;
  }
}

export async function startConsumer(rabbitmqUrl: string, log: (msg: string) => void): Promise<void> {
  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  // Dead letter setup
  await channel.assertExchange(DLX, 'fanout', { durable: true });
  await channel.assertQueue(DLQ, { durable: true });
  await channel.bindQueue(DLQ, DLX, '');

  // Main queue with DLX
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUE, {
    durable: true,
    deadLetterExchange: DLX,
  });

  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE, EXCHANGE, key);
  }

  await channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const routingKey = msg.fields.routingKey;
      const data = JSON.parse(msg.content.toString()) as Record<string, unknown>;
      const messageId = msg.properties.messageId as string | undefined;

      if (messageId) {
        const existing = await NotificationModel.findOne({ messageId }).exec();
        if (existing) {
          channel.ack(msg);
          return;
        }
      }

      await NotificationModel.create({
        type: routingKey as 'room.created' | 'user.joined' | 'draw.completed' | 'wishlist.updated',
        roomId: data.roomId as string | undefined,
        message: buildMessage(routingKey, data),
        messageId,
      });

      log(`Processed event: ${routingKey}`);
      channel.ack(msg);
    } catch (error) {
      console.error('Failed to process RabbitMQ message:', error);
      channel.nack(msg, false, false);
    }
  });

  log(`RabbitMQ consumer started, listening on queue "${QUEUE}"`);

  process.on('SIGTERM', async () => {
    await channel.close();
    await connection.close();
  });
}
