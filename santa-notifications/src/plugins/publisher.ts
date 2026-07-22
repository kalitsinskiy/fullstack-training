import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import amqp from 'amqplib';
import { randomUUID } from 'crypto';

const EXCHANGE = 'santa.events';

declare module 'fastify' {
  interface FastifyInstance {
    publish: (routingKey: string, data: Record<string, unknown>) => Promise<void>;
  }
}

async function publisherPlugin(fastify: FastifyInstance) {
  const url = fastify.config.rabbitUrl;

  if (!url) {
    fastify.log.warn('RABBIT_URL not set — event publisher disabled');
    fastify.decorate('publish', async () => { /* noop */ });
    return;
  }

  let connection: amqp.ChannelModel;
  let channel: amqp.Channel;

  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    fastify.log.info('RabbitMQ publisher connected');
  } catch (err) {
    fastify.log.error({ err }, 'Failed to connect RabbitMQ publisher — publish disabled');
    fastify.decorate('publish', async () => { /* noop */ });
    return;
  }

  fastify.decorate('publish', async (routingKey: string, data: Record<string, unknown>) => {
    try {
      channel.publish(
        EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(data)),
        { persistent: true, messageId: randomUUID() },
      );
    } catch (err) {
      fastify.log.error({ err, routingKey }, 'Failed to publish event');
    }
  });

  fastify.addHook('onClose', async () => {
    try {
      await channel?.close();
      await connection?.close();
    } catch {
      // ignore close errors on shutdown
    }
  });
}

export default fp(publisherPlugin, { name: 'publisher', dependencies: ['config'] });
