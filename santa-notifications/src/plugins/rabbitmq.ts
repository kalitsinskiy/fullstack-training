import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import amqp from 'amqplib';
import { handleMessage } from '../events/consumer';

const EXCHANGE = 'santa.events';
const QUEUE = 'notifications.events';
const DLX = 'santa.dlx';
const DLQ = 'santa.dlq';
const ROUTING_KEYS = ['room.created', 'user.joined', 'draw.completed', 'wishlist.updated'];

declare module 'fastify' {
  interface FastifyInstance {
    rabbit?: { connection: amqp.ChannelModel; channel: amqp.Channel };
  }
}

async function rabbitmqPlugin(fastify: FastifyInstance): Promise<void> {
  if (fastify.config.env === 'test') return;

  try {
    const connection = await amqp.connect(fastify.config.rabbitmqUrl);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(DLX, 'fanout', { durable: true });
    await channel.assertQueue(DLQ, { durable: true });
    await channel.bindQueue(DLQ, DLX, '');
    await channel.assertQueue(QUEUE, {
      durable: true,
      deadLetterExchange: DLX,
    });

    for (const key of ROUTING_KEYS) {
      await channel.bindQueue(QUEUE, EXCHANGE, key);
    }

    await channel.consume(QUEUE, (msg) => void handleMessage(channel, msg, fastify.santaApi));

    fastify.decorate('rabbit', { connection, channel });
    fastify.log.info(`RabbitMQ consumer bound to "${QUEUE}"`);

    fastify.addHook('onClose', async () => {
      await channel.close();
      await connection.close();
    });
  } catch (err) {
    fastify.log.error({ err }, 'RabbitMQ consumer failed to start');
  }
}

export default fp(rabbitmqPlugin, { name: 'rabbitmq', dependencies: ['config', 'santa-api'] });
