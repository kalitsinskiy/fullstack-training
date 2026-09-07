import { buildNotificationMessage } from './messages';
import type { NotificationType } from '../models/notification';

describe('buildNotificationMessage', () => {
  it('room.created includes the room name', () => {
    expect(buildNotificationMessage('room.created', {}, 'Office Party')).toBe(
      'Room "Office Party" was created'
    );
  });

  it('user.joined includes the user name and room name', () => {
    expect(buildNotificationMessage('user.joined', { userName: 'Alice' }, 'Office Party')).toBe(
      'Alice joined "Office Party"'
    );
  });

  it('draw.completed names the room', () => {
    expect(buildNotificationMessage('draw.completed', {}, 'Office Party')).toBe(
      'The draw for "Office Party" is complete! Check your assignment'
    );
  });

  it('wishlist.updated names the room', () => {
    expect(buildNotificationMessage('wishlist.updated', {}, 'Office Party')).toBe(
      'A wishlist was updated in "Office Party"'
    );
  });

  it('falls back for an unknown routing key', () => {
    const unknownKey = 'unknown.event' as NotificationType;

    expect(buildNotificationMessage(unknownKey, {}, 'Office Party')).toBe(
      'New event: unknown.event'
    );
  });
});
