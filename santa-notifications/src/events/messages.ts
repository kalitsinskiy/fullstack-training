export function buildNotificationMessage(
  routingKey: string,
  data: Record<string, unknown>
): string {
  switch (routingKey) {
    case 'room.created': {
      return `Room "${String(data.roomName ?? 'a room')}" was created`;
    }

    case 'user.joined': {
      return `${String(data.userName ?? 'Someone')} joined the room`;
    }

    case 'draw.completed': {
      return 'The draw is complete! Check your assignment';
    }

    case 'wishlist.updated': {
      return 'A wishlist was updated in your room';
    }

    default: {
      return `New event: ${routingKey}`;
    }
  }
}
