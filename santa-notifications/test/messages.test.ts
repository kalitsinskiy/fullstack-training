import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app';
import { Message } from '../src/models/message';
import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/db';

const JWT_SECRET = 'test-jwt-secret';

function makeToken(userId: string): string {
  return jwt.sign({ sub: userId, email: 'test@example.com', role: 'user' }, JWT_SECRET);
}

function authHeader(userId: string) {
  return { Authorization: `Bearer ${makeToken(userId)}` };
}

// Stub out the SantaApiClient so tests don't need a live santa-api.
// We use jest.mock at module level and provide per-test return values via the
// module singleton getter that the routes call.
jest.mock('../src/services/santa-api-client', () => {
  const getRelations = jest.fn();
  const getUserById = jest.fn();
  return {
    getSantaApiClient: () => ({ getRelations, getUserById }),
    __mocks: { getRelations, getUserById },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mocks } = require('../src/services/santa-api-client') as {
  __mocks: {
    getRelations: jest.Mock;
    getUserById: jest.Mock;
  };
};

describe('santa-notifications messages (HTTP)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.RABBITMQ_URL = '';
    await setupTestDb();
  }, 300_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    jest.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // POST /api/messages
  // ---------------------------------------------------------------------------
  describe('POST /api/messages', () => {
    it('returns 401 without a token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        payload: { roomId: 'room-1', to: 'giftee', text: 'hi' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 400 when body is missing required fields', async () => {
      const userId = new Types.ObjectId().toString();
      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers: authHeader(userId),
        payload: { roomId: 'room-1' }, // missing `to` and `text`
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when `to` is not giftee or santa', async () => {
      const userId = new Types.ObjectId().toString();
      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers: authHeader(userId),
        payload: { roomId: 'room-1', to: 'stranger', text: 'hello' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 403 when getRelations throws (santa-api unreachable)', async () => {
      const userId = new Types.ObjectId().toString();
      __mocks.getRelations.mockRejectedValueOnce(new Error('circuit open'));

      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers: authHeader(userId),
        payload: { roomId: 'room-1', to: 'giftee', text: 'hi' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().message).toMatch(/unable to verify/i);
    });

    it('returns 403 when the draw has not happened yet (gifteeId is null)', async () => {
      const userId = new Types.ObjectId().toString();
      __mocks.getRelations.mockResolvedValueOnce({ gifteeId: null, santaId: null });

      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers: authHeader(userId),
        payload: { roomId: 'room-1', to: 'giftee', text: 'hi' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('stores the message and returns 201 with direction:out and thread:giftee', async () => {
      const senderId = new Types.ObjectId().toString();
      const gifteeId = new Types.ObjectId().toString();
      __mocks.getRelations.mockResolvedValueOnce({ gifteeId, santaId: 'santa-id' });

      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers: authHeader(senderId),
        payload: { roomId: 'room-1', to: 'giftee', text: 'hope you like books!' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.text).toBe('hope you like books!');
      expect(body.direction).toBe('out');
      expect(body.thread).toBe('giftee');
      expect(body).not.toHaveProperty('senderId');

      const stored = await Message.findById(body.id).lean();
      expect(stored?.senderId).toBe(senderId);
      expect(stored?.recipientId).toBe(gifteeId);
    });

    it('stores the message and returns direction:out and thread:santa when to=santa', async () => {
      const senderId = new Types.ObjectId().toString();
      const santaId = new Types.ObjectId().toString();
      __mocks.getRelations.mockResolvedValueOnce({ gifteeId: 'giftee-id', santaId });

      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers: authHeader(senderId),
        payload: { roomId: 'room-1', to: 'santa', text: 'thanks santa!' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.direction).toBe('out');
      expect(body.thread).toBe('santa');
      expect(body).not.toHaveProperty('senderId');

      const stored = await Message.findById(body.id).lean();
      expect(stored?.recipientId).toBe(santaId);
    });

    it('never returns senderId in the response', async () => {
      const senderId = new Types.ObjectId().toString();
      const gifteeId = new Types.ObjectId().toString();
      __mocks.getRelations.mockResolvedValueOnce({ gifteeId, santaId: null });

      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers: authHeader(senderId),
        payload: { roomId: 'room-1', to: 'giftee', text: 'hi' },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json()).not.toHaveProperty('senderId');
    });

    it('trims whitespace from message text', async () => {
      const senderId = new Types.ObjectId().toString();
      const gifteeId = new Types.ObjectId().toString();
      __mocks.getRelations.mockResolvedValueOnce({ gifteeId, santaId: null });

      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers: authHeader(senderId),
        payload: { roomId: 'room-1', to: 'giftee', text: '   padded   ' },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().text).toBe('padded');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/messages/:roomId
  // ---------------------------------------------------------------------------
  describe('GET /api/messages/:roomId', () => {
    it('returns 401 without a token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/messages/room-1' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 when getRelations throws', async () => {
      const userId = new Types.ObjectId().toString();
      __mocks.getRelations.mockRejectedValueOnce(new Error('circuit open'));

      const res = await app.inject({
        method: 'GET',
        url: '/api/messages/room-1',
        headers: authHeader(userId),
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns null threads when draw has not happened', async () => {
      const userId = new Types.ObjectId().toString();
      __mocks.getRelations.mockResolvedValueOnce({ gifteeId: null, santaId: null });

      const res = await app.inject({
        method: 'GET',
        url: '/api/messages/room-1',
        headers: authHeader(userId),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ giftee: null, santa: null });
    });

    it('returns both threads with correct direction labels', async () => {
      const alice = new Types.ObjectId().toString();
      const bob = new Types.ObjectId().toString();
      const charlie = new Types.ObjectId().toString();

      // alice's giftee=bob, santa=charlie
      __mocks.getRelations.mockResolvedValueOnce({ gifteeId: bob, santaId: charlie });
      __mocks.getUserById.mockResolvedValueOnce({
        id: bob,
        displayName: 'Bob',
        email: 'bob@test.com',
      });

      await Message.create([
        // alice → bob (in alice's giftee thread, direction out)
        { senderId: alice, recipientId: bob, roomId: 'room-1', text: 'hi bob' },
        // bob → alice (in alice's giftee thread, direction in)
        { senderId: bob, recipientId: alice, roomId: 'room-1', text: 'hi alice' },
        // charlie → alice (in alice's santa thread, direction in)
        { senderId: charlie, recipientId: alice, roomId: 'room-1', text: 'do you like puzzles?' },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/messages/room-1',
        headers: authHeader(alice),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();

      expect(body.giftee.id).toBe(bob);
      expect(body.giftee.name).toBe('Bob');
      expect(body.giftee.messages).toHaveLength(2);
      expect(body.giftee.messages[0]).toMatchObject({ text: 'hi bob', direction: 'out' });
      expect(body.giftee.messages[1]).toMatchObject({ text: 'hi alice', direction: 'in' });

      expect(body.santa.messages).toHaveLength(1);
      expect(body.santa.messages[0]).toMatchObject({
        text: 'do you like puzzles?',
        direction: 'in',
      });

      // privacy: giftee thread has no senderId, santa block has no id/name
      body.giftee.messages.forEach((m: Record<string, unknown>) =>
        expect(m).not.toHaveProperty('senderId')
      );
      expect(body.santa).not.toHaveProperty('id');
      expect(body.santa).not.toHaveProperty('name');
    });

    it('does not leak messages from other rooms', async () => {
      const alice = new Types.ObjectId().toString();
      const bob = new Types.ObjectId().toString();

      __mocks.getRelations.mockResolvedValueOnce({ gifteeId: bob, santaId: null });
      __mocks.getUserById.mockResolvedValueOnce({
        id: bob,
        displayName: 'Bob',
        email: 'b@test.com',
      });

      await Message.create([
        { senderId: alice, recipientId: bob, roomId: 'room-1', text: 'in room 1' },
        { senderId: alice, recipientId: bob, roomId: 'room-OTHER', text: 'in other room' },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/messages/room-1',
        headers: authHeader(alice),
      });

      expect(res.statusCode).toBe(200);
      const { giftee } = res.json();
      expect(giftee.messages).toHaveLength(1);
      expect(giftee.messages[0].text).toBe('in room 1');
    });

    it('returns messages sorted oldest-first', async () => {
      const alice = new Types.ObjectId().toString();
      const bob = new Types.ObjectId().toString();

      __mocks.getRelations.mockResolvedValueOnce({ gifteeId: bob, santaId: null });
      __mocks.getUserById.mockResolvedValueOnce({
        id: bob,
        displayName: 'Bob',
        email: 'b@test.com',
      });

      const t1 = new Date('2024-12-01T08:00:00Z');
      const t2 = new Date('2024-12-01T09:00:00Z');
      const t3 = new Date('2024-12-01T10:00:00Z');

      await Message.create([
        { senderId: alice, recipientId: bob, roomId: 'room-1', text: 'third', createdAt: t3 },
        { senderId: alice, recipientId: bob, roomId: 'room-1', text: 'first', createdAt: t1 },
        { senderId: alice, recipientId: bob, roomId: 'room-1', text: 'second', createdAt: t2 },
      ]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/messages/room-1',
        headers: authHeader(alice),
      });

      const texts = res.json().giftee.messages.map((m: { text: string }) => m.text);
      expect(texts).toEqual(['first', 'second', 'third']);
    });
  });
});
