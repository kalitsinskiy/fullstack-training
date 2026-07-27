import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { connect, type Channel, type ChannelModel } from 'amqplib';
import { SANTA_EVENTS_EXCHANGE } from '../events/topology';

export type PublishEvent = (routingKey: string, payload: unknown) => void;

declare module 'fastify' {
  interface FastifyInstance {
    publishEvent: PublishEvent;
  }
}

async function publisherPlugin(fastify: FastifyInstance): Promise<void> {
  const noop: PublishEvent = () => {};

  if (fastify.config.env === 'test') {
    fastify.decorate('publishEvent', noop);
    fastify.log.info('NODE_ENV=test — RabbitMQ publisher not started');
    return;
  }

  let connection: ChannelModel;
  let channel: Channel;

  try {
    connection = await connect(fastify.config.rabbitmqUrl);
    channel = await connection.createChannel();
    await channel.assertExchange(SANTA_EVENTS_EXCHANGE, 'topic', { durable: true });
  } catch (error) {
    fastify.decorate('publishEvent', noop);
    fastify.log.error({ err: error }, 'Could not connect to RabbitMQ — not publishing events');
    return;
  }

  const publishEvent: PublishEvent = (routingKey, payload) => {
    try {
      channel.publish(SANTA_EVENTS_EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        persistent: true,
      });
    } catch (error) {
      fastify.log.error({ err: error, routingKey }, 'Could not publish event');
    }
  };

  fastify.decorate('publishEvent', publishEvent);

  fastify.addHook('onClose', async () => {
    await channel.close();
    await connection.close();
  });

  fastify.log.info({ exchange: SANTA_EVENTS_EXCHANGE }, 'RabbitMQ publisher ready');
}

export default fp(publisherPlugin, { name: 'publisher', dependencies: ['config'] });
