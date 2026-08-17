import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { buildApp } from '../src/app';
import { NotificationModel } from '../src/models/notification';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

const JWT_SECRET = 'test-jwt-secret';

// Mock amqplib so the events plugin never opens a real socket.
// consume() captures the handler callback so tests can invoke it directly.
jest.mock('amqplib', () => {
  const ack = jest.fn();
  const nack = jest.fn();
  const consume = jest.fn();
  const mockChannel = {
    assertExchange: jest.fn().mockResolvedValue({}),
    assertQueue: jest.fn().mockResolvedValue({}),
    bindQueue: jest.fn().mockResolvedValue({}),
    prefetch: jest.fn(),
    consume,
    ack,
    nack,
    close: jest.fn().mockResolvedValue({}),
  };
  const mockConnection = {
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn().mockResolvedValue({}),
  };
  return {
    connect: jest.fn().mockResolvedValue(mockConnection),
    __mocks: { mockChannel, mockConnection },
  };
});

jest.mock('../src/services/santa-api-client', () => {
  const getRoomById = jest.fn();
  const getUserById = jest.fn();
  const getRelations = jest.fn();
  return {
    getSantaApiClient: () => ({ getRoomById, getUserById, getRelations }),
    __mocks: { getRoomById, getUserById, getRelations },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mocks: amqpMocks } = require('amqplib') as {
  __mocks: {
    mockChannel: {
      ack: jest.Mock;
      nack: jest.Mock;
      consume: jest.Mock;
    };
  };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mocks: clientMocks } = require('../src/services/santa-api-client') as {
  __mocks: {
    getRoomById: jest.Mock;
    getUserById: jest.Mock;
    getRelations: jest.Mock;
  };
};

type AmqpMessage = {
  content: Buffer;
  fields: {
    routingKey: string;
    exchange: string;
    deliveryTag: number;
    redelivered: boolean;
    consumerTag: string;
  };
  properties: { messageId?: string; contentType: string; headers: Record<string, unknown> };
};

function makeMsg(routingKey: string, payload: object, messageId?: string): AmqpMessage {
  return {
    content: Buffer.from(JSON.stringify(payload)),
    fields: {
      routingKey,
      exchange: 'santa.events',
      deliveryTag: 1,
      redelivered: false,
      consumerTag: 'test',
    },
    properties: { messageId, contentType: 'application/json', headers: {} },
  };
}

async function getConsumeCallback(): Promise<(msg: AmqpMessage | null) => Promise<void>> {
  const calls = amqpMocks.mockChannel.consume.mock.calls;
  if (!calls.length) throw new Error('consume() was never called — plugin did not register');
  return calls[calls.length - 1][1];
}

describe('santa-notifications events consumer', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.RABBITMQ_URL = 'amqp://localhost'; // non-empty → plugin activates
    process.env.SANTA_API_URL = 'http://mock-santa-api';
    process.env.SERVICE_API_KEY = 'test-key';
    await setupTestDb();
  }, 300_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    jest.clearAllMocks();
    // Re-wire consume mock after clearAllMocks so it still captures the callback.
    amqpMocks.mockChannel.consume.mockImplementation(
      (_queue: string, cb: (msg: AmqpMessage | null) => Promise<void>) => {
        return Promise.resolve({ consumerTag: 'test', cb });
      }
    );
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // draw.completed
  // ---------------------------------------------------------------------------
  describe('draw.completed', () => {
    it('creates one notification per participant on the happy path', async () => {
      const roomId = 'room-happy';
      const participantIds = [
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString(),
      ];

      clientMocks.getRoomById.mockResolvedValue({
        id: roomId,
        name: 'Xmas 2026',
        memberIds: participantIds,
      });

      const consume = await getConsumeCallback();
      await consume(makeMsg('draw.completed', { roomId, participantIds }));

      const docs = await NotificationModel.find({ roomId }).lean();
      expect(docs).toHaveLength(3);
      docs.forEach((doc) => {
        expect(doc.type).toBe('draw.completed');
        expect(doc.message).toContain('Xmas 2026');
      });
      expect(amqpMocks.mockChannel.ack).toHaveBeenCalledTimes(1);
    });

    it('falls back to participantIds from the payload when getRoomById throws', async () => {
      const roomId = 'room-fallback';
      const participantIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];

      clientMocks.getRoomById.mockRejectedValue(new Error('santa-api unreachable'));

      const consume = await getConsumeCallback();
      await consume(makeMsg('draw.completed', { roomId, participantIds }));

      const docs = await NotificationModel.find({ roomId }).lean();
      expect(docs).toHaveLength(2);
      docs.forEach((doc) => {
        expect(doc.type).toBe('draw.completed');
        expect(doc.message).toBe('The Secret Santa draw is complete! Check your assignment.');
      });
      expect(amqpMocks.mockChannel.ack).toHaveBeenCalledTimes(1);
      expect(amqpMocks.mockChannel.nack).not.toHaveBeenCalled();
    });

    it('creates no notifications when roomId is absent', async () => {
      const consume = await getConsumeCallback();
      await consume(
        makeMsg('draw.completed', { participantIds: [new Types.ObjectId().toString()] })
      );

      expect(await NotificationModel.countDocuments()).toBe(0);
      expect(amqpMocks.mockChannel.ack).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Idempotency
  // ---------------------------------------------------------------------------
  describe('idempotency', () => {
    it('does not re-process a message whose messageId was already stored', async () => {
      const createdBy = new Types.ObjectId().toString();
      const messageId = 'msg-unique-001';
      const msg = makeMsg('room.created', { roomName: 'Idem Room', createdBy }, messageId);

      const consume = await getConsumeCallback();
      await consume(msg);

      // First delivery creates the notification
      const afterFirst = await NotificationModel.find({ messageId }).lean();
      expect(afterFirst).toHaveLength(1);

      // Second delivery with the same messageId — must be a no-op
      await consume(msg);

      const afterSecond = await NotificationModel.find({ messageId }).lean();
      expect(afterSecond).toHaveLength(1);
      expect(amqpMocks.mockChannel.ack).toHaveBeenCalledTimes(2);
    });
  });
});
