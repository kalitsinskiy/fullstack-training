import { buildNotificationMessage } from './messages';

describe('buildNotificationMessage', () => {
  it('room.created includes the room name', () => {
    expect(buildNotificationMessage('room.created', { roomName: 'Office Party' })).toBe(
      'Room "Office Party" was created'
    );
  });

  it('user.joined includes the user name', () => {
    expect(buildNotificationMessage('user.joined', { userName: 'Alice' })).toBe(
      'Alice joined the room'
    );
  });

  it('draw.completed have fixed copy', () => {
    expect(buildNotificationMessage('draw.completed', {})).toMatch(/draw is complete/i);
  });

  it('wishlist.updated have fixed copy', () => {
    expect(buildNotificationMessage('wishlist.updated', {})).toMatch(/wishlist was updated/i);
  });

  it('falls back for an unknown routing key', () => {
    expect(buildNotificationMessage('unknown.event', {})).toBe('New event: unknown.event');
  });
});
