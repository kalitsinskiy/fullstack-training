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
