import type { NotificationType } from '../models/notification';

export function buildNotificationMessage(
  routingKey: NotificationType,
  data: Record<string, unknown>,
  roomName: string
): string {
  switch (routingKey) {
    case 'room.created': {
      return `Room "${roomName}" was created`;
    }

    case 'user.joined': {
      return `${String(data.userName ?? 'Someone')} joined "${roomName}"`;
    }

    case 'draw.completed': {
      return `The draw for "${roomName}" is complete! Check your assignment`;
    }

    case 'wishlist.updated': {
      return `A wishlist was updated in "${roomName}"`;
    }

    case 'room.date_changed':
      return `The gift exchange for "${roomName}" has a new date`;

    default: {
      routingKey satisfies never;

      return `New event: ${String(routingKey)}`;
    }
  }
}
