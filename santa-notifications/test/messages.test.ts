import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { MessageModel } from '../src/models/message';
import { clearTestDb, setupTestDb, teardownTestDb } from './helpers/db';
import { FakeSantaApi } from './helpers/fake-santa-api';

const ALICE = '665f0c2ab7d13a5e8b1c4d01';
const BOB = '665f0c2ab7d13a5e8b1c4d02';
const CAROL = '665f0c2ab7d13a5e8b1c4d03';
const ROOM_ID = '665f0c2ab7d13a5e8b1c4d9f';
const OTHER_ROOM_ID = '665f0c2ab7d13a5e8b1c4d9a';

interface MessageBody {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  direction: 'in' | 'out';
  thread: 'giftee' | 'santa';
}

interface ThreadsBody {
  giftee: { id: string; name: string; messages: MessageBody[] } | null;
  santa: { messages: MessageBody[] } | null;
}

describe('santa-notifications messages (HTTP)', () => {
  let app: FastifyInstance;
  let api: FakeSantaApi;

  const bearer = (userId: string) =>
    `Bearer ${app.jwt.sign({ sub: userId, email: 'user@test.com', role: 'user' })}`;

  const send = (userId: string, body: unknown) =>
    app.inject({
      method: 'POST',
      url: '/api/messages',
      headers: { authorization: bearer(userId) },
      payload: body as Record<string, unknown>,
    });

  const readThreads = (userId: string, roomId = ROOM_ID) =>
    app.inject({
      method: 'GET',
      url: `/api/messages/${roomId}`,
      headers: { authorization: bearer(userId) },
    });

  function drawRoom(roomId = ROOM_ID) {
    api.relations[`${roomId}:${ALICE}`] = { gifteeId: BOB, santaId: CAROL };
    api.relations[`${roomId}:${BOB}`] = { gifteeId: CAROL, santaId: ALICE };
    api.relations[`${roomId}:${CAROL}`] = { gifteeId: ALICE, santaId: BOB };
  }

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    api = new FakeSantaApi(
      {},
      {
        [ALICE]: { id: ALICE, displayName: 'Alice', email: 'alice@test.com' },
        [BOB]: { id: BOB, displayName: 'Bob', email: 'bob@test.com' },
        [CAROL]: { id: CAROL, displayName: 'Carol', email: 'carol@test.com' },
      }
    );
    app = buildApp({ santaApi: api });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/messages', () => {
    it('401s without a token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        payload: { roomId: ROOM_ID, to: 'giftee', text: 'hi' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('403s with a generic message when the room is not drawn', async () => {
      const res = await send(ALICE, { roomId: ROOM_ID, to: 'giftee', text: 'hi' });

      expect(res.statusCode).toBe(403);
      const { error } = res.json() as { error: { message: string } };
      expect(error.message).toBe('You cannot send a message in this room yet');
      expect(error.message).not.toContain(BOB);
      expect(await MessageModel.countDocuments({})).toBe(0);
    });

    it('403s generically when santa-api cannot be reached', async () => {
      drawRoom();
      api.failWith = new Error('connect ECONNREFUSED');

      const res = await send(ALICE, { roomId: ROOM_ID, to: 'giftee', text: 'hi' });

      expect(res.statusCode).toBe(403);
      expect((res.json() as { error: { message: string } }).error.message).toBe(
        'You cannot send a message in this room yet'
      );
    });

    it('stores the sender but returns only the sender-side view', async () => {
      drawRoom();

      const res = await send(ALICE, {
        roomId: ROOM_ID,
        to: 'giftee',
        text: '  hope you like puzzles!  ',
      });

      expect(res.statusCode).toBe(201);
      const body = res.json() as MessageBody & { senderId?: string };
      expect(body).toEqual({
        id: expect.any(String),
        roomId: ROOM_ID,
        text: 'hope you like puzzles!',
        createdAt: expect.any(String),
        direction: 'out',
        thread: 'giftee',
      });
      expect(body.senderId).toBeUndefined();

      const stored = await MessageModel.findById(body.id).exec();
      expect(stored?.senderId).toBe(ALICE);
      expect(stored?.recipientId).toBe(BOB);
    });

    it('resolves the recipient from `to`, so the client never names a user', async () => {
      drawRoom();

      await send(ALICE, { roomId: ROOM_ID, to: 'giftee', text: 'to my giftee' });
      await send(ALICE, { roomId: ROOM_ID, to: 'santa', text: 'thanks, santa!' });

      const toGiftee = await MessageModel.findOne({ text: 'to my giftee' }).exec();
      const toSanta = await MessageModel.findOne({ text: 'thanks, santa!' }).exec();
      expect(toGiftee?.recipientId).toBe(BOB);
      expect(toSanta?.recipientId).toBe(CAROL);
    });

    it('ignores a smuggled recipientId — the recipient is always server-resolved', async () => {
      drawRoom();

      const res = await send(ALICE, {
        roomId: ROOM_ID,
        to: 'giftee',
        text: 'hi',
        recipientId: CAROL,
      });

      expect(res.statusCode).toBe(201);
      const stored = await MessageModel.findOne({ text: 'hi' }).exec();
      expect(stored?.recipientId).toBe(BOB);
    });

    it('validates the body', async () => {
      drawRoom();

      const cases = [
        { roomId: ROOM_ID, to: 'everyone', text: 'hi' },
        { roomId: 'not-an-object-id', to: 'giftee', text: 'hi' },
        { roomId: ROOM_ID, to: 'giftee', text: '' },
        { roomId: ROOM_ID, to: 'giftee', text: '   ' },
        { roomId: ROOM_ID, to: 'giftee', text: 'x'.repeat(501) },
        { roomId: ROOM_ID, to: 'giftee' },
      ];

      for (const payload of cases) {
        const res = await send(ALICE, payload);
        expect(res.statusCode).toBe(400);
      }
      expect(await MessageModel.countDocuments({})).toBe(0);
    });

    it('accepts a message of exactly 500 characters', async () => {
      drawRoom();

      const res = await send(ALICE, {
        roomId: ROOM_ID,
        to: 'giftee',
        text: 'x'.repeat(500),
      });

      expect(res.statusCode).toBe(201);
    });

    it('pushes to the recipient in their mirror thread, without the sender', async () => {
      drawRoom();
      const toUser = jest.spyOn(app.realtime, 'toUser');

      try {
        await send(ALICE, { roomId: ROOM_ID, to: 'giftee', text: 'a hint' });

        expect(toUser).toHaveBeenCalledTimes(1);
        const [recipientId, event, payload] = toUser.mock.calls[0];
        expect(recipientId).toBe(BOB);
        expect(event).toBe('message:received');
        expect(payload).toEqual({
          id: expect.any(String),
          roomId: ROOM_ID,
          text: 'a hint',
          createdAt: expect.any(String),
          direction: 'in',
          thread: 'santa',
        });
        expect(JSON.stringify(payload)).not.toContain(ALICE);
      } finally {
        toUser.mockRestore();
      }
    });

    it('pushes into the giftee thread when replying to your santa', async () => {
      drawRoom();
      const toUser = jest.spyOn(app.realtime, 'toUser');

      try {
        await send(BOB, { roomId: ROOM_ID, to: 'santa', text: 'thank you!' });

        const [recipientId, , payload] = toUser.mock.calls[0];
        expect(recipientId).toBe(ALICE);
        expect(payload).toMatchObject({ thread: 'giftee', direction: 'in' });
      } finally {
        toUser.mockRestore();
      }
    });
  });

  describe('GET /api/messages/:roomId', () => {
    it('401s without a token', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/messages/${ROOM_ID}` });
      expect(res.statusCode).toBe(401);
    });

    it('returns both threads as null before the draw', async () => {
      const res = await readThreads(ALICE);

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ giftee: null, santa: null });
    });

    it('names the giftee thread and keeps the santa thread anonymous', async () => {
      drawRoom();
      await send(ALICE, { roomId: ROOM_ID, to: 'giftee', text: 'hope you like puzzles!' });

      const res = await readThreads(BOB);

      expect(res.statusCode).toBe(200);
      const body = res.json() as ThreadsBody;

      expect(body.giftee).toEqual({
        id: CAROL,
        name: 'Carol',
        messages: [],
      });
      expect(body.santa?.messages).toEqual([
        {
          id: expect.any(String),
          roomId: ROOM_ID,
          text: 'hope you like puzzles!',
          createdAt: expect.any(String),
          direction: 'in',
        },
      ]);
      expect(body.santa).not.toHaveProperty('id');
      expect(body.santa).not.toHaveProperty('name');
      expect(res.payload).not.toContain('senderId');
      expect(res.payload).not.toContain(ALICE);
      expect(res.payload).not.toContain('carol@test.com');
    });

    it('is the same conversation under two different names', async () => {
      drawRoom();
      await send(ALICE, { roomId: ROOM_ID, to: 'giftee', text: 'any hints?' });
      await send(BOB, { roomId: ROOM_ID, to: 'santa', text: 'socks, please' });

      const alices = (await readThreads(ALICE)).json() as ThreadsBody;
      const bobs = (await readThreads(BOB)).json() as ThreadsBody;

      expect(alices.giftee?.name).toBe('Bob');
      expect(alices.giftee?.messages.map((m) => [m.text, m.direction])).toEqual([
        ['any hints?', 'out'],
        ['socks, please', 'in'],
      ]);

      expect(bobs.santa?.messages.map((m) => [m.text, m.direction])).toEqual([
        ['any hints?', 'in'],
        ['socks, please', 'out'],
      ]);

      expect(bobs.santa?.messages.map((m) => m.id)).toEqual(
        alices.giftee?.messages.map((m) => m.id)
      );
    });

    it('keeps the two threads separate and scoped to the room', async () => {
      drawRoom();
      drawRoom(OTHER_ROOM_ID);

      await send(ALICE, { roomId: ROOM_ID, to: 'giftee', text: 'for Bob' });
      await send(CAROL, { roomId: ROOM_ID, to: 'giftee', text: 'for Alice' });
      await send(ALICE, { roomId: OTHER_ROOM_ID, to: 'giftee', text: 'other room' });

      const body = (await readThreads(ALICE)).json() as ThreadsBody;

      expect(body.giftee?.messages.map((m) => m.text)).toEqual(['for Bob']);
      expect(body.santa?.messages.map((m) => m.text)).toEqual(['for Alice']);
    });

    it('orders each thread oldest first', async () => {
      drawRoom();
      await MessageModel.create([
        {
          senderId: ALICE,
          recipientId: BOB,
          roomId: ROOM_ID,
          text: 'second',
          createdAt: new Date('2026-02-01'),
        },
        {
          senderId: BOB,
          recipientId: ALICE,
          roomId: ROOM_ID,
          text: 'first',
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const body = (await readThreads(ALICE)).json() as ThreadsBody;

      expect(body.giftee?.messages.map((m) => m.text)).toEqual(['first', 'second']);
    });

    it('400s on a malformed room id', async () => {
      const res = await readThreads(ALICE, 'not-an-object-id');
      expect(res.statusCode).toBe(400);
    });
  });
});
