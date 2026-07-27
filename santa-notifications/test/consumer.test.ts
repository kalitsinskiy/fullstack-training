import type { ConsumeMessage } from 'amqplib';
import { Types } from 'mongoose';
import { handleMessage } from '../src/events/consumer';
import { NotificationModel } from '../src/models/notification';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

const roomId = new Types.ObjectId().toString();

function makeMsg(routingKey: string, data: unknown, messageId = 'm1'): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(data)),
    fields: { routingKey, deliveryTag: 1, redelivered: false, exchange: 'santa.events' },
    properties: { messageId },
  } as unknown as ConsumeMessage;
}

function fakeChannel() {
  return { ack: jest.fn(), nack: jest.fn() };
}

describe('handleMessage (consumer)', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('creates a Notification and acks a valid event', async () => {
    const channel = fakeChannel();
    await handleMessage(
      channel as never,
      makeMsg('room.created', { roomId, roomName: 'Office Party' })
    );

    const docs = await NotificationModel.find().lean();

    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      type: 'room.created',
      message: 'Room "Office Party" was created',
      messageId: 'm1',
    });
    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('is idempotent - a redelivered messageId creates no duplicate and still acks', async () => {
    const channel = fakeChannel();
    const msg = makeMsg('room.created', { roomId, roomName: 'Office Party' }, 'dup-1');

    await handleMessage(channel as never, msg);
    await handleMessage(channel as never, msg);

    expect(await NotificationModel.countDocuments()).toBe(1);
    expect(channel.ack).toHaveBeenCalledTimes(2);
  });

  it('nacks (-> DLQ) a malformed message and creates nothing', async () => {
    const channel = fakeChannel();
    const badMsg = {
      ...makeMsg('room.created', {}),
      content: Buffer.from('not json{'),
    } as ConsumeMessage;

    await handleMessage(channel as never, badMsg);

    expect(await NotificationModel.countDocuments()).toBe(0);
    expect(channel.nack).toHaveBeenCalledWith(badMsg, false, false);
  });
});
