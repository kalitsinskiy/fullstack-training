import type { ConsumeMessage } from 'amqplib';
import { Types } from 'mongoose';
import { handleMessage } from '../src/events/consumer';
import { NotificationModel } from '../src/models/notification';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';
import { SantaApiClient } from '../src/services/santa-api-client';

const roomId = new Types.ObjectId().toString();
const owner = new Types.ObjectId().toString();
const joiner = new Types.ObjectId().toString();
const third = new Types.ObjectId().toString();

const client = {
  getRoomById: jest.fn(async () => ({
    id: roomId,
    name: 'Office Party',
    memberIds: [owner, joiner, third],
  })),
  getUserById: jest.fn(),
} as unknown as SantaApiClient;

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

function fakeIo() {
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));

  return { io: { to } as unknown as import('socket.io').Server, to, emit };
}

describe('handleMessage - fan-out', () => {
  beforeAll(async () => await setupTestDb());
  afterAll(async () => await teardownTestDb());
  beforeEach(async () => {
    await clearTestDb();
    jest.clearAllMocks();
  });

  it('user.joined -> one notification per member EXCEPT the joiner', async () => {
    const channel = fakeChannel();

    await handleMessage(
      channel as never,
      makeMsg('user.joined', { roomId, userId: joiner }),
      client,
      fakeIo().io
    );

    const docs = await NotificationModel.find().lean();
    const recipients = docs.map((d) => d.userId?.toString()).sort();

    expect(recipients).toEqual([owner, third].sort());
    expect(docs.every((d) => d.type === 'user.joined')).toBe(true);
    expect(channel.ack).toHaveBeenCalledTimes(1);
  });

  it('draw.completed => redelivering the same messageId creates no duplcates', async () => {
    const channel = fakeChannel();

    await handleMessage(
      channel as never,
      makeMsg('draw.completed', { roomId }),
      client,
      fakeIo().io
    );

    expect(await NotificationModel.countDocuments()).toBe(3);
  });

  it('is idempotent - redelivering the same message created no duplicates', async () => {
    const channel = fakeChannel();
    const msg = makeMsg('draw.completed', { roomId }, 'dup-1');

    await handleMessage(channel as never, msg, client, fakeIo().io);
    await handleMessage(channel as never, msg, client, fakeIo().io);

    expect(await NotificationModel.countDocuments()).toBe(3);
    expect(channel.ack).toHaveBeenCalledTimes(2);
  });

  it('nacks to the DQL when santa-api enrichment fails', async () => {
    const failing = {
      getRoomById: jest.fn(async () => {
        throw new Error('down');
      }),
    } as unknown as SantaApiClient;
    const channel = fakeChannel();

    await handleMessage(
      channel as never,
      makeMsg('draw.completed', { roomId }),
      failing,
      fakeIo().io
    );

    expect(await NotificationModel.countDocuments()).toBe(0);
    expect(channel.nack).toHaveBeenCalledWith(expect.anything(), false, false);
  });

  it('user.joined -> emits a notification to each recipient AND room:member-joined', async () => {
    const channel = fakeChannel();
    const { io, to, emit } = fakeIo();

    await handleMessage(
      channel as never,
      makeMsg('user.joined', { roomId, userId: joiner }),
      client,
      io
    );

    expect(to).toHaveBeenCalledWith(`user:${owner}`);
    expect(to).toHaveBeenCalledWith(`user:${third}`);
    expect(to).toHaveBeenCalledWith(`room:${roomId}`);
    expect(emit).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({ type: 'user.joined', roomId })
    );
    expect(emit).toHaveBeenCalledWith('room:member-joined', { roomId, userId: joiner });
  });

  it('draw.completed -> emits room:draw-completed to the room', async () => {
    const channel = fakeChannel();
    const { io, to, emit } = fakeIo();

    await handleMessage(channel as never, makeMsg('draw.completed', { roomId }), client, io);

    expect(to).toHaveBeenCalledWith(`room:${roomId}`);
    expect(emit).toHaveBeenCalledWith('room:draw-completed', { roomId });
  });
});
