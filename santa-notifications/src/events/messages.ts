export function buildNotificationMessage(
  routingKey: string,
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

    default: {
      return `New event: ${routingKey}`;
    }
  }
}
