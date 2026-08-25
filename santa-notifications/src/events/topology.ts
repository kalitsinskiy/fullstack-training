import type { Channel } from 'amqplib';

export const SANTA_EVENTS_EXCHANGE = 'santa.events';

export const NOTIFICATIONS_QUEUE = 'notifications.events';

export const DEAD_LETTER_EXCHANGE = 'santa.dlx';
export const DEAD_LETTER_QUEUE = 'santa.dlq';

export const EVENT_ROUTING_KEYS = [
  'room.created',
  'user.joined',
  'draw.completed',
  'wishlist.updated',
] as const;

export const MESSAGE_SENT_ROUTING_KEY = 'message.sent';

/**
 * Idempotent — safe to call from both the consumer and the publisher, so
 * events published before the consumer's first-ever start still land in a
 * durable, already-bound queue instead of being unroutable and dropped.
 */
export async function assertNotificationsTopology(channel: Channel): Promise<void> {
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
