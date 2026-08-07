jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

import type { ConsumeMessage } from 'amqplib';
import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { buildApp } from '../src/app';
import { handleMessage } from '../src/events/consumer';
import { NotificationModel } from '../src/models/notification';
import { SantaApiClient } from '../src/services/santa-api-client';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

/**
 * CROSS-SERVICE TEST (README Step 4) — the only test that spans the whole pipeline inside one process:
 *
 * draw.completed (RabbitMQ envelope) -> handleMessage -> MongoDB -> GET /api/notifications (JWT) -> the user
 */

const roomId = new Types.ObjectId().toString();
const alice = new Types.ObjectId().toString();
const bob = new Types.ObjectId().toString();
const alex = new Types.ObjectId().toString();

const client = {
  getRoomById: jest.fn(async () => ({
    id: roomId,
    name: 'Office Party',
    memberIds: [alice, bob, alex],
  })),
  getUserById: jest.fn(),
} as unknown as SantaApiClient;

function drawCompleted(messageId = 'draw-1'): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify({ roomId })),
    fields: {
      routingKey: 'draw.completed',
      deliveryTag: 1,
      redelivered: false,
      exchange: 'santa.events',
    },
    properties: { messageId },
  } as unknown as ConsumeMessage;
}

const fakeIo = () => ({ to: jest.fn(() => ({ emit: jest.fn() })) });
const fakeLog = () => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn() });

describe('Cross-service: draw.completed -> notification -> REST', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    jest.clearAllMocks();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.redis.quit();
    await app.close();
  });

  it('every participant can read their own draw notification over HTTP', async () => {
    const channel = { ack: jest.fn(), nack: jest.fn() };

    // 1. The event arrives, exactly as RabbitMQ would deliver it.
    await handleMessage(
      channel as never,
      drawCompleted(),
      client,
      fakeIo() as never,
      fakeLog() as never
    );

    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(await NotificationModel.countDocuments()).toBe(3);

    // 2. Each participant fetch their own notification throught the real
    //    authenticated route
    for (const userId of [alice, bob, alex]) {
      const res = await app.inject({
        method: 'GET',
        url: '/api/notifications',
        headers: {
          authorization: `Bearer ${app.jwt.sign({
            sub: userId,
            email: 'example@example.com',
            role: 'user',
          })}`,
        },
      });

      expect(res.statusCode).toBe(200);

      const body = res.json();

      expect(body.data).toHaveLength(1);
      expect(body.unreadCount).toBe(1);
      expect(body.data[0]).toMatchObject({
        userId,
        roomId,
        type: 'draw.completed',
        read: false,
      });

      expect(body.data[0].message).toContain('Office Party');
    }
  });

  it('a redelivered revent does not double notify anyone', async () => {
    const channel = { ack: jest.fn(), nack: jest.fn() };
    const msg = drawCompleted('draw-up');

    await handleMessage(channel as never, msg, client, fakeIo() as never, fakeLog() as never);
    await handleMessage(channel as never, msg, client, fakeIo() as never, fakeLog() as never);

    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications',
      headers: {
        authorization: `Bearer ${app.jwt.sign({
          sub: alice,
          email: 'example@example.com',
          role: 'user',
        })}`,
      },
    });

    expect(res.json().data).toHaveLength(1);
    expect(channel.ack).toHaveBeenCalledTimes(2); // both acked, 1 stored
  });
});
