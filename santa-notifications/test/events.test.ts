import { buildNotificationMessage, handleEvent } from '../src/events/handle-event';
import { NotificationModel } from '../src/models/notification';
import { clearTestDb, setupTestDb, teardownTestDb } from './helpers/db';

describe('event handler', () => {
  beforeAll(async () => {
    await setupTestDb();
    await NotificationModel.syncIndexes();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await NotificationModel.syncIndexes();
  });

  describe('buildNotificationMessage', () => {
    it('renders a message per routing key', () => {
      expect(buildNotificationMessage('room.created', { roomName: 'Office Party' })).toBe(
        'Room "Office Party" was created'
      );
      expect(buildNotificationMessage('user.joined', { userName: 'Alice' })).toBe(
        'Alice joined the room'
      );
      expect(buildNotificationMessage('draw.completed', {})).toBe(
        'The draw is complete! Check your assignment'
      );
      expect(buildNotificationMessage('wishlist.updated', {})).toBe(
        'A wishlist was updated in your room'
      );
    });

    it('falls back for an unrecognised key', () => {
      expect(buildNotificationMessage('room.exploded', {})).toBe('New event: room.exploded');
    });
  });

  describe('handleEvent', () => {
    const roomId = '665f0c2ab7d13a5e8b1c4d9f';

    it('creates a room-scoped notification', async () => {
      const result = await handleEvent(
        'room.created',
        { roomId, roomName: 'Office Party', createdBy: 'u1' } as never,
        'msg-1'
      );
      expect(result).toBe('created');

      const notifications = await NotificationModel.find().exec();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('room.created');
      expect(notifications[0].message).toBe('Room "Office Party" was created');
      expect(notifications[0].roomId?.toString()).toBe(roomId);
      expect(notifications[0].messageId).toBe('msg-1');
      expect(notifications[0].read).toBe(false);
      expect(notifications[0].userId ?? null).toBeNull();
    });

    it('is idempotent — the same messageId twice yields one notification', async () => {
      const payload = { roomId, userName: 'Alice' };

      await expect(handleEvent('user.joined', payload, 'dupe-1')).resolves.toBe('created');
      await expect(handleEvent('user.joined', payload, 'dupe-1')).resolves.toBe('duplicate');

      await expect(NotificationModel.countDocuments()).resolves.toBe(1);
    });

    it('survives concurrent redelivery of the same message', async () => {
      const payload = { roomId, userName: 'Alice' };

      const results = await Promise.all([
        handleEvent('user.joined', payload, 'race-1'),
        handleEvent('user.joined', payload, 'race-1'),
      ]);

      expect(results.filter((r) => r === 'created')).toHaveLength(1);
      expect(results.filter((r) => r === 'duplicate')).toHaveLength(1);
      await expect(NotificationModel.countDocuments()).resolves.toBe(1);
    });

    it('allows many notifications without a messageId', async () => {
      await expect(handleEvent('draw.completed', { roomId })).resolves.toBe('created');
      await expect(handleEvent('draw.completed', { roomId })).resolves.toBe('created');

      await expect(NotificationModel.countDocuments()).resolves.toBe(2);
    });

    it('throws on an unsupported routing key so it dead-letters', async () => {
      await expect(handleEvent('room.exploded', { roomId }, 'bad-1')).rejects.toThrow(
        'Unsupported routing key'
      );
      await expect(NotificationModel.countDocuments()).resolves.toBe(0);
    });
  });
});
