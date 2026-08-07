import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import amqp from 'amqplib';
import { handleMessage } from '../events/consumer';

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

type RabbitState = { connection?: amqp.ChannelModel; channel?: amqp.Channel };

declare module 'fastify' {
  interface FastifyInstance {
    rabbitmq: RabbitState;
    publishEvent: (routingKey: string, payload: Record<string, unknown>) => void;
  }
}

async function rabbitmqPlugin(fastify: FastifyInstance): Promise<void> {
  const state: RabbitState = {};
  fastify.decorate('rabbitmq', state);

  fastify.decorate('publishEvent', (routingKey: string, payload: Record<string, unknown>) => {
    const channel = state.channel;

    if (!channel) {
      fastify.log.debug({ routingKey }, 'publishEvent skipped — no RabbitMQ channel');
      return;
    }

    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
    });
  });

  if (fastify.config.env === 'test') return;

  let closing = false;
  let attempt = 0;

  async function connect(): Promise<void> {
    let connection: amqp.ChannelModel | undefined;

    try {
      connection = await amqp.connect(fastify.config.rabbitmqUrl);

      // Attached before any setup work: an unhandled 'error' event would crash the process.
      connection.on('error', (err) => {
        fastify.log.error({ err }, 'RabbitMQ connection error');
      });

      connection.on('close', () => {
        if (state.connection !== connection) return;

        state.connection = undefined;
        state.channel = undefined;

        if (closing) return;

        fastify.log.warn('RabbitMQ connection closed — reconnecting');

        scheduleReconnect();
      });

      const channel = await connection.createChannel();

      channel.on('error', (err) => {
        fastify.log.error({ err }, 'RabbitMQ channel error');
      });

      // A channel can die on its own (failed ack/nack, broker channel exception) while the
      // connection stays up. Recycle the whole connection so the single reconnect path above runs.
      channel.on('close', () => {
        if (state.channel !== channel) return;

        state.channel = undefined;

        if (closing) return;

        fastify.log.warn('RabbitMQ channel closed — recycling connection');

        void state.connection?.close().catch(() => undefined);
      });

      await channel.prefetch(10);

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

      await channel.consume(QUEUE, (msg) => {
        // handleMessage nacks on failure, and that nack itself throws on a dead channel —
        // catch here so the rejection never escapes into amqplib.
        void handleMessage(channel, msg, fastify.santaApi, fastify.io, fastify.log).catch((err) => {
          fastify.log.error({ err }, 'Unhandled error while handling RabbitMQ message');
        });
      });

      state.connection = connection;
      state.channel = channel;
      attempt = 0;
      fastify.log.info(`RabbitMQ consumer bound to "${QUEUE}"`);
    } catch (err) {
      fastify.log.error({ err, attempt }, 'RabbitMQ connect failed');

      // Setup failed midway — drop the half-built connection instead of leaking it.
      await connection?.close().catch(() => undefined);

      if (!closing) scheduleReconnect();
    }
  }

  function scheduleReconnect(): void {
    const delay = Math.min(30_000, 1000 * 2 ** attempt++);

    setTimeout(() => void connect(), delay).unref();
  }

  fastify.addHook('onClose', async () => {
    closing = true;

    await state.channel?.close().catch(() => undefined);
    await state.connection?.close().catch(() => undefined);
  });

  await connect();
}

export default fp(rabbitmqPlugin, { name: 'rabbitmq', dependencies: ['config', 'santa-api'] });
