import { roomEventFor } from './consumer';

describe('roomEventFor', () => {
  it('user.joined -> room:member-joined with roomId + userId', () => {
    expect(roomEventFor('user.joined', 'r1', { userId: 'u2' })).toEqual({
      event: 'room:member-joined',
      payload: { roomId: 'r1', userId: 'u2' },
    });
  });

  it('draw.completed -> room:draw-completed with roomId', () => {
    expect(roomEventFor('draw.completed', 'r1', {})).toEqual({
      event: 'room:draw-completed',
      payload: { roomId: 'r1' },
    });
  });

  it('room.created / wishlist.updated -> no room-wide broadcast', () => {
    expect(roomEventFor('room.created', 'r1', {})).toBeNull();
    expect(roomEventFor('wishlist.updated', 'r1', {})).toBeNull();
  });

  it('room.date_changed -> room:date-changed', () => {
    expect(roomEventFor('room.date_changed', 'r1', {})).toEqual({
      event: 'room:date-changed',
      payload: { roomId: 'r1' },
    });
  });
});
