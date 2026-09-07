import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { clearTestDb, setupTestDb, teardownTestDb } from './helpers/db';
import { buildApp } from '../src/app';
import { MessageModel } from '../src/models/message';

jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

const roomId = new Types.ObjectId().toString();
const alice = new Types.ObjectId().toString();
const bob = new Types.ObjectId().toString();
const alex = new Types.ObjectId().toString();

const tokenFor = (app: FastifyInstance, sub: string) =>
  app.jwt.sign({ sub, email: 'example@example.com', role: 'user' });

function fakeIo() {
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));

  return { io: { to } as never, to, emit };
}

describe('Anonymous messages', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    app = buildApp();

    await app.ready();

    jest.spyOn(app.santaApi, 'getRelations').mockResolvedValue({ gifteeId: bob, santaId: alex });
    jest
      .spyOn(app.santaApi, 'getUserById')
      .mockResolvedValue({ id: bob, displayName: 'Bob', email: 'bob@example.com' });
  });

  afterEach(async () => {
    await app.redis.quit();
    await app.close();
  });

  it('401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/messages',
      payload: { roomId, to: 'giftee', text: 'hi' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('sends to the giftee: stores senderId but never returns it', async () => {
    const { io, to, emit } = fakeIo();
    app.io = io;

    const res = await app.inject({
      method: 'POST',
      url: '/api/messages',
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
      payload: { roomId, to: 'giftee', text: 'Hello' },
    });

    expect(res.statusCode).toBe(201);

    const body = res.json();

    expect(body).toMatchObject({ text: 'Hello', direction: 'out', thread: 'giftee' });
    expect(body.senderId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(alice);

    const stored = await MessageModel.findOne().lean();
    expect(stored?.senderId.toString()).toBe(alice);
    expect(stored?.recipientId.toString()).toBe(bob);

    expect(to).toHaveBeenCalledWith(`user:${bob}`);
    expect(emit).toHaveBeenCalledWith(
      'message:received',
      expect.objectContaining({ direction: 'in', thread: 'santa' })
    );
    expect(JSON.stringify(emit.mock.calls[0][1])).not.toContain(alice);
  });

  it('replying to your santa resolves the reverse edge (client never names them)', async () => {
    app.io = fakeIo().io;

    const res = await app.inject({
      method: 'POST',
      url: '/api/messages',
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
      payload: { roomId, to: 'santa', text: 'Hello, santa!' },
    });

    expect(res.statusCode).toBe(201);

    const stored = await MessageModel.findOne().lean();
    expect(stored?.recipientId.toString()).toBe(alex);
    expect(res.json().thread).toBe('santa');
  });

  it('403 (generic) when the room is not drawn — no relations', async () => {
    jest.spyOn(app.santaApi, 'getRelations').mockResolvedValue({ gifteeId: null, santaId: null });

    const res = await app.inject({
      method: 'POST',
      url: '/api/messages',
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
      payload: { roomId, to: 'giftee', text: 'hi' },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error.message).not.toMatch(/assigned|giftee|santa/i);
    expect(await MessageModel.countDocuments()).toBe(0);
  });

  it('400 when the text is empty or over 500 chars', async () => {
    const headers = { authorization: `Bearer ${tokenFor(app, alice)}` };

    for (const text of ['', 'x'.repeat(501)]) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers,
        payload: { roomId, to: 'giftee', text },
      });

      expect(res.statusCode).toBe(400);
    }
  });

  it('GET /:roomId returns both threads with correct direction and no identities', async () => {
    await MessageModel.create([
      { senderId: alice, recipientId: bob, roomId, text: 'to my giftee' },
      { senderId: bob, recipientId: alice, roomId, text: 'from my giftee' },
      { senderId: alex, recipientId: alice, roomId, text: 'from my santa' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: `/api/messages/${roomId}`,
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.giftee).toMatchObject({ id: bob, name: 'Bob' });
    expect(body.giftee.messages.map((m: { direction: string }) => m.direction)).toEqual([
      'out',
      'in',
    ]);
    expect(body.santa.messages).toHaveLength(1);
    expect(body.santa.messages[0].direction).toBe('in');

    expect(body.santa.id).toBeUndefined();
    expect(body.santa.name).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('senderId');
    expect(JSON.stringify(body.santa)).not.toContain(alex);
  });

  it('GET /unread aggregates per room and PATCH /:roomId/read clears it', async () => {
    await MessageModel.create([
      { senderId: bob, recipientId: alice, roomId, text: 'from giftee' },
      { senderId: alex, recipientId: alice, roomId, text: 'from santa' },
      { senderId: alice, recipientId: bob, roomId, text: 'mine — never unread for me' },
    ]);
    const headers = { authorization: `Bearer ${tokenFor(app, alice)}` };

    const before = await app.inject({ method: 'GET', url: '/api/messages/unread', headers });
    expect(before.json()).toEqual({ total: 2, rooms: [{ roomId, count: 2 }] });

    const patch = await app.inject({
      method: 'PATCH',
      url: `/api/messages/${roomId}/read`,
      headers,
      payload: { thread: 'giftee' },
    });
    expect(patch.json()).toEqual({ updated: 1 });

    const after = await app.inject({ method: 'GET', url: '/api/messages/unread', headers });

    expect(after.json()).toEqual({ total: 1, rooms: [{ roomId, count: 1 }] });
  });

  it("cannot mark another user's messages read", async () => {
    await MessageModel.create({ senderId: alex, recipientId: bob, roomId, text: 'for bob only' });

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/messages/${roomId}/read`,
      headers: { authorization: `Bearer ${tokenFor(app, alice)}` },
      payload: {},
    });

    expect(res.json()).toEqual({ updated: 0 });
    expect((await MessageModel.findOne({ recipientId: bob }).lean())?.read).toBe(false);
  });

  describe('reactions', () => {
    function relationsPerUser() {
      jest
        .spyOn(app.santaApi, 'getRelations')
        .mockImplementation(async (_roomId: string, userId: string) =>
          userId === alice ? { gifteeId: bob, santaId: alex } : { gifteeId: null, santaId: alice }
        );
    }

    const react = (sub: string, id: string, emoji: string | null) =>
      app.inject({
        method: 'PUT',
        url: `/api/messages/${id}/reaction`,
        headers: { authorization: `Bearer ${tokenFor(app, sub)}` },
        payload: { emoji },
      });

    async function aliceMessagedBob() {
      const doc = await MessageModel.create({
        senderId: alice,
        recipientId: bob,
        roomId,
        text: 'Hello',
      });

      return doc._id.toString();
    }

    it('stores the sender reaction role-keyed and returns it as MY reaction', async () => {
      relationsPerUser();
      const id = await aliceMessagedBob();
      const res = await react(alice, id, '🎁');

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ myReaction: '🎁', theirReaction: null });

      const stored = await MessageModel.findById(id).lean();

      expect(stored?.senderReaction).toBe('🎁');
      expect(stored?.recipientReaction).toBeUndefined();
    });

    it('notifies only the counterparty, in THEIR thread, with no user id', async () => {
      relationsPerUser();
      const { io, to, emit } = fakeIo();
      app.io = io;
      const id = await aliceMessagedBob();

      await react(alice, id, '❤️');

      expect(to).toHaveBeenCalledWith(`user:${bob}`);
      expect(emit).toHaveBeenCalledWith(
        'message:reaction',
        expect.objectContaining({ thread: 'santa', theirReaction: '❤️' })
      );

      expect(JSON.stringify(emit.mock.calls[0][1])).not.toContain(alice);
      expect(JSON.stringify(emit.mock.calls[0][1])).not.toContain(bob);
    });

    it('the counterparty sees my reaction as THEIRS, and still no identity', async () => {
      relationsPerUser();
      const id = await aliceMessagedBob();

      await react(alice, id, '😂');

      const res = await app.inject({
        method: 'GET',
        url: `/api/messages/${roomId}`,
        headers: { authorization: `Bearer ${tokenFor(app, bob)}` },
      });

      const body = res.json();

      expect(body.santa.messages[0]).toMatchObject({
        direction: 'in',
        myReaction: null,
        theirReaction: '😂',
      });
      expect(body.santa.id).toBeUndefined();
      expect(JSON.stringify(body)).not.toContain(alice);
    });

    it('lets the recipient react too, into the other slot', async () => {
      relationsPerUser();
      const id = await aliceMessagedBob();
      const res = await react(bob, id, '👍');

      expect(res.json()).toMatchObject({ myReaction: '👍' });

      const stored = await MessageModel.findById(id).lean();

      expect(stored?.recipientReaction).toBe('👍');
      expect(stored?.senderReaction).toBeUndefined();
    });

    it('clears a reaction with null', async () => {
      relationsPerUser();
      const id = await aliceMessagedBob();

      await react(alice, id, '🎉');
      const res = await react(alice, id, null);

      expect(res.json()).toMatchObject({ myReaction: null });
      expect((await MessageModel.findById(id).lean())?.senderReaction).toBeNull();
    });

    it('rejects an emoji outside the allow-list', async () => {
      relationsPerUser();

      const id = await aliceMessagedBob();
      const res = await react(alice, id, '🔥');

      expect(res.statusCode).toBe(400);
      expect((await MessageModel.findById(id).lean())?.senderReaction).toBeUndefined();
    });

    it('404s on a message you are not part of, without confirming it exists', async () => {
      relationsPerUser();

      const doc = await MessageModel.create({
        senderId: alex,
        recipientId: bob,
        roomId,
        text: 'not for alice',
      });
      const res = await react(alice, doc._id.toString(), '🎁');

      expect(res.statusCode).toBe(404);
    });

    it('400s on a malformed message id', async () => {
      relationsPerUser();

      const res = await react(alice, 'not-an-object-id', '🎁');

      expect(res.statusCode).toBe(400);
    });
  });
});
