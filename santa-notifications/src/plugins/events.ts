import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import amqp from 'amqplib';
import { NotificationModel, NotificationType } from '../models/notification';

const EXCHANGE = 'santa.events';
const QUEUE = 'notifications.events';
const DLX = 'santa.dlx';
const DLQ = 'santa.dlq';

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

        // Idempotency check
        if (messageId) {
          const existing = await NotificationModel.findOne({ messageId }).exec();
          if (existing) {
            channel.ack(msg);
            return;
          }
        }

        await NotificationModel.create({
          type: routingKey as NotificationType,
          roomId: data.roomId as string | undefined,
          message: buildMessage(routingKey, data),
          messageId: messageId,
        });

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
