import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { EventPayload, UnprocessableEventError, handleEvent } from '../events/handle-event';
import { NOTIFICATIONS_QUEUE, assertNotificationsTopology } from '../events/topology';

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;
const MAX_DELIVERY_ATTEMPTS = 3;

async function consumerPlugin(fastify: FastifyInstance) {
  if (fastify.config.env === 'test') {
    fastify.log.info('NODE_ENV=test — RabbitMQ consumer not started');
    return;
  }

  let connection: ChannelModel | undefined;
  let channel: Channel | undefined;
  let closing = false;
  let reconnectAttempt = 0;

  async function onMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message || !channel) return;

    const { routingKey } = message.fields;
    const { messageId } = message.properties;

    try {
      const data = JSON.parse(message.content.toString()) as EventPayload;
      const { status, created } = await handleEvent(routingKey, data, messageId, {
        api: fastify.santaApi,
        realtime: fastify.realtime,
      });

      channel.ack(message);
      fastify.log.info(
        { routingKey, messageId, status, recipients: created },
        'Event processed'
      );
    } catch (error) {
      const attempt = Number(message.properties.headers?.['x-retry-count'] ?? 0);
      const isPoison = error instanceof UnprocessableEventError;

      if (isPoison || attempt >= MAX_DELIVERY_ATTEMPTS) {
        channel.nack(message, false, false);
        fastify.log.error(
          { err: error, routingKey, messageId, attempt },
          isPoison ? 'Poison event — dead-lettered' : 'Retries exhausted — dead-lettered'
        );
        return;
      }

      // Transient failure (santa-api blip, Mongo hiccup): ack the original
      // and republish with an incremented counter instead of nacking straight
      // to the DLQ, so the user still gets the notification once things recover.
      channel.ack(message);
      channel.sendToQueue(NOTIFICATIONS_QUEUE, message.content, {
        ...message.properties,
        headers: { ...message.properties.headers, 'x-retry-count': attempt + 1 },
      });
      fastify.log.warn(
        { err: error, routingKey, messageId, attempt: attempt + 1 },
        'Transient failure — requeued for retry'
      );
    }
  }

  async function connectAndConsume(): Promise<void> {
    connection = await connect(fastify.config.rabbitmqUrl);
    channel = await connection.createChannel();
    await assertNotificationsTopology(channel);
    await channel.prefetch(1);

    connection.on('error', (error: Error) => {
      fastify.log.error({ err: error }, 'RabbitMQ connection error');
    });
    connection.on('close', () => {
      if (closing) return;
      fastify.log.warn('RabbitMQ connection closed — reconnecting');
      scheduleReconnect();
    });
    channel.on('error', (error: Error) => {
      fastify.log.error({ err: error }, 'RabbitMQ channel error');
    });

    await channel.consume(NOTIFICATIONS_QUEUE, (message) => {
      void onMessage(message);
    });

    reconnectAttempt = 0;
    fastify.log.info(
      { queue: NOTIFICATIONS_QUEUE },
      'Consuming RabbitMQ events'
    );
  }

  function scheduleReconnect(): void {
    reconnectAttempt += 1;
    const delay = Math.min(
      RECONNECT_MAX_DELAY_MS,
      RECONNECT_BASE_DELAY_MS * 2 ** (reconnectAttempt - 1)
    );
    setTimeout(() => {
      if (closing) return;
      connectAndConsume().catch((error: Error) => {
        fastify.log.error({ err: error }, 'RabbitMQ reconnect failed');
        scheduleReconnect();
      });
    }, delay);
  }

  try {
    await connectAndConsume();
  } catch (error) {
    fastify.log.error(
      { err: error },
      'Could not connect to RabbitMQ — will keep retrying in the background'
    );
    scheduleReconnect();
  }

  fastify.addHook('onClose', async () => {
    closing = true;
    await channel?.close();
    await connection?.close();
  });
}

export default fp(consumerPlugin, {
  name: 'consumer',
  dependencies: ['config', 'socket', 'santa-api'],
});
