import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { EventPayload, handleEvent } from '../events/handle-event';
import {
  DEAD_LETTER_EXCHANGE,
  DEAD_LETTER_QUEUE,
  EVENT_ROUTING_KEYS,
  NOTIFICATIONS_QUEUE,
  SANTA_EVENTS_EXCHANGE,
} from '../events/topology';

async function assertTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(DEAD_LETTER_EXCHANGE, 'fanout', { durable: true });
  await channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true });
  await channel.bindQueue(DEAD_LETTER_QUEUE, DEAD_LETTER_EXCHANGE, '');

  await channel.assertExchange(SANTA_EVENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(NOTIFICATIONS_QUEUE, {
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE,
  });

  for (const routingKey of EVENT_ROUTING_KEYS) {
    await channel.bindQueue(NOTIFICATIONS_QUEUE, SANTA_EVENTS_EXCHANGE, routingKey);
  }
}

async function consumerPlugin(fastify: FastifyInstance) {
  if (fastify.config.env === 'test') {
    fastify.log.info('NODE_ENV=test — RabbitMQ consumer not started');
    return;
  }

  let connection: ChannelModel;
  let channel: Channel;

  try {
    connection = await connect(fastify.config.rabbitmqUrl);
    channel = await connection.createChannel();
    await assertTopology(channel);
  } catch (error) {
    fastify.log.error({ err: error }, 'Could not connect to RabbitMQ — not consuming events');
    return;
  }

  await channel.prefetch(1);

  async function onMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) return;

    const { routingKey } = message.fields;
    const { messageId } = message.properties;

    try {
      const data = JSON.parse(message.content.toString()) as EventPayload;
      const result = await handleEvent(routingKey, data, messageId);

      channel.ack(message);
      fastify.log.info({ routingKey, messageId, result }, 'Event processed');
    } catch (error) {
      channel.nack(message, false, false);
      fastify.log.error({ err: error, routingKey, messageId }, 'Event failed — dead-lettered');
    }
  }

  await channel.consume(NOTIFICATIONS_QUEUE, (message) => {
    void onMessage(message);
  });

  fastify.log.info(
    { queue: NOTIFICATIONS_QUEUE, routingKeys: EVENT_ROUTING_KEYS },
    'Consuming RabbitMQ events'
  );

  fastify.addHook('onClose', async () => {
    await channel.close();
    await connection.close();
  });
}

export default fp(consumerPlugin, { name: 'consumer', dependencies: ['config'] });
