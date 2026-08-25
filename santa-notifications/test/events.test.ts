import { buildNotificationMessage, handleEvent } from '../src/events/handle-event';
import { NotificationModel } from '../src/models/notification';
import { FakeSantaApi } from './helpers/fake-santa-api';
import { clearTestDb, setupTestDb, teardownTestDb } from './helpers/db';

const ROOM_ID = '665f0c2ab7d13a5e8b1c4d9f';
const ALICE = '665f0c2ab7d13a5e8b1c4d01';
const BOB = '665f0c2ab7d13a5e8b1c4d02';
const CAROL = '665f0c2ab7d13a5e8b1c4d03';

function fakeApi(): FakeSantaApi {
  return new FakeSantaApi(
    { [ROOM_ID]: { id: ROOM_ID, name: 'Office Party', memberIds: [ALICE, BOB, CAROL] } },
    { [BOB]: { id: BOB, displayName: 'Bob', email: 'bob@test.com' } }
  );
}

async function recipientsOf(): Promise<string[]> {
  const notifications = await NotificationModel.find().exec();
  return notifications.map((n) => n.userId?.toString() ?? 'null').sort();
}

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
    it('renders a message per routing key, quoting the room name', () => {
      expect(buildNotificationMessage('room.created', {}, 'Office Party')).toBe(
        'Room "Office Party" was created'
      );
      expect(buildNotificationMessage('user.joined', { userName: 'Alice' }, 'Office Party')).toBe(
        'Alice joined "Office Party"'
      );
      expect(buildNotificationMessage('draw.completed', {}, 'Office Party')).toBe(
        'The draw for "Office Party" is complete — check your giftee!'
      );
      expect(buildNotificationMessage('wishlist.updated', {}, 'Office Party')).toBe(
        'A wishlist was updated in "Office Party"'
      );
    });

    it('falls back for an unrecognised key', () => {
      expect(buildNotificationMessage('room.exploded', {})).toBe('New event: room.exploded');
    });
  });

  describe('fan-out', () => {
    it('draw.completed notifies every participant, including the owner', async () => {
      const api = fakeApi();
      const result = await handleEvent('draw.completed', { roomId: ROOM_ID }, 'msg-draw', { api });

      expect(result).toEqual({ status: 'created', created: 3 });
      await expect(recipientsOf()).resolves.toEqual([ALICE, BOB, CAROL].sort());

      const notification = await NotificationModel.findOne({ userId: ALICE }).exec();
      expect(notification?.message).toBe(
        'The draw for "Office Party" is complete — check your giftee!'
      );
      expect(notification?.roomId?.toString()).toBe(ROOM_ID);
      expect(notification?.read).toBe(false);
    });

    it('room.created notifies the room members it has at that point', async () => {
      const api = new FakeSantaApi({
        [ROOM_ID]: { id: ROOM_ID, name: 'Office Party', memberIds: [ALICE] },
      });
      const result = await handleEvent(
        'room.created',
        { roomId: ROOM_ID, createdBy: ALICE },
        'msg-created',
        { api }
      );

      expect(result).toEqual({ status: 'created', created: 1 });
      await expect(recipientsOf()).resolves.toEqual([ALICE]);
      await expect(NotificationModel.findOne({ userId: ALICE }).exec()).resolves.toMatchObject({
        message: 'Room "Office Party" was created',
      });
    });

    it('user.joined notifies existing members but never the joiner', async () => {
      const api = fakeApi();
      const result = await handleEvent(
        'user.joined',
        { roomId: ROOM_ID, userId: BOB, userName: 'Bob' },
        'msg-join',
        { api }
      );

      expect(result).toEqual({ status: 'created', created: 2 });
      await expect(recipientsOf()).resolves.toEqual([ALICE, CAROL].sort());
      await expect(NotificationModel.findOne({ userId: ALICE }).exec()).resolves.toMatchObject({
        message: 'Bob joined "Office Party"',
      });
    });

    it('resolves the joiner name over HTTP when the event only carries the id', async () => {
      const api = fakeApi();
      await handleEvent('user.joined', { roomId: ROOM_ID, userId: BOB }, 'msg-join-2', { api });

      expect(api.userCalls).toEqual([BOB]);
      await expect(NotificationModel.findOne({ userId: ALICE }).exec()).resolves.toMatchObject({
        message: 'Bob joined "Office Party"',
      });
    });

    it('wishlist.updated notifies the others, not the editor', async () => {
      const api = fakeApi();
      await handleEvent('wishlist.updated', { roomId: ROOM_ID, userId: CAROL }, 'msg-wish', {
        api,
      });

      await expect(recipientsOf()).resolves.toEqual([ALICE, BOB].sort());
    });
  });

  describe('idempotency', () => {
    it('the same messageId twice yields one notification per recipient', async () => {
      const api = fakeApi();
      const payload = { roomId: ROOM_ID, userId: BOB, userName: 'Bob' };

      await expect(handleEvent('user.joined', payload, 'dupe-1', { api })).resolves.toEqual({
        status: 'created',
        created: 2,
      });
      await expect(handleEvent('user.joined', payload, 'dupe-1', { api })).resolves.toEqual({
        status: 'duplicate',
        created: 0,
      });

      await expect(NotificationModel.countDocuments()).resolves.toBe(2);
    });

    it('survives concurrent redelivery of the same message', async () => {
      const api = fakeApi();
      const payload = { roomId: ROOM_ID, userId: BOB, userName: 'Bob' };

      const results = await Promise.all([
        handleEvent('user.joined', payload, 'race-1', { api }),
        handleEvent('user.joined', payload, 'race-1', { api }),
      ]);

      expect(results.reduce((total, r) => total + r.created, 0)).toBe(2);
      await expect(NotificationModel.countDocuments()).resolves.toBe(2);
    });

    it('allows repeats when the producer sent no messageId', async () => {
      const api = fakeApi();
      await handleEvent('draw.completed', { roomId: ROOM_ID }, undefined, { api });
      await handleEvent('draw.completed', { roomId: ROOM_ID }, undefined, { api });

      await expect(NotificationModel.countDocuments()).resolves.toBe(6);
    });
  });

  describe('failures dead-letter', () => {
    it('throws on an unsupported routing key', async () => {
      const api = fakeApi();
      await expect(
        handleEvent('room.exploded', { roomId: ROOM_ID }, 'bad-1', { api })
      ).rejects.toThrow('Unsupported routing key');
      await expect(NotificationModel.countDocuments()).resolves.toBe(0);
    });

    it('throws when the event has no roomId to enrich from', async () => {
      const api = fakeApi();
      await expect(handleEvent('draw.completed', {}, 'bad-2', { api })).rejects.toThrow(
        'missing roomId'
      );
    });

    it('propagates a santa-api outage so the message is retried, not lost', async () => {
      const api = fakeApi();
      api.failWith = new Error('santa-api is down');

      await expect(
        handleEvent('draw.completed', { roomId: ROOM_ID }, 'bad-3', { api })
      ).rejects.toThrow('santa-api is down');
      await expect(NotificationModel.countDocuments()).resolves.toBe(0);
    });
  });
});
