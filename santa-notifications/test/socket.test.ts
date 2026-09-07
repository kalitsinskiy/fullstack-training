jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

import type { FastifyInstance } from 'fastify';
import { io as ioClient, type Socket } from 'socket.io-client';
import { buildApp } from '../src/app';
import { createSocketServer } from '../src/socket';

describe('Socket.IO sever', () => {
  let app: FastifyInstance;
  let url: string;

  beforeAll(() => {
    process.env.MONGO_URL = 'mongodb://localhost:27017/test';
  });

  beforeEach(async () => {
    app = buildApp();

    await app.ready();
    await app.listen({ port: 0, host: '127.0.0.1' });

    app.io = createSocketServer(app);

    const addr = app.server.address() as { port: number };

    url = `http://127.0.0.1:${addr.port}`;
  });

  afterEach(async () => {
    app.io?.close();
    await app.close();
  });

  function connect(token?: string): Socket {
    return ioClient(url, {
      auth: token ? { token } : {},
      reconnection: false,
      transports: ['websocket'],
    });
  }

  const tokenFor = (sub: string) => app.jwt.sign({ sub, email: 'example@test.com', role: 'user' });

  it('rejects a connection with no token', async () => {
    const connection = connect();

    await expect(new Promise((_, rej) => connection.on('connect_error', rej))).rejects.toThrow(
      /token required/i
    );

    connection.close();
  });

  it('rejects a bad token', async () => {
    const connection = connect('not-a-jwt');

    await expect(new Promise((_, rej) => connection.on('connect_error', rej))).rejects.toThrow(
      /invalid or expired/i
    );

    connection.close();
  });

  it('accepts a valid token and connects', async () => {
    const connection = connect(tokenFor('u1'));

    await new Promise<void>((res) => connection.on('connect', () => res()));

    expect(connection.connected).toBe(true);

    connection.close();
  });

  it('logs instead of leaving an unhandled rejection when the presence write fails', async () => {
    const warn = jest.spyOn(app.log, 'warn');

    jest.spyOn(app.redis, 'hincrby').mockRejectedValue(new Error('Connection is closed.'));

    const connection = connect(tokenFor('u1'));

    await new Promise<void>((res) => connection.on('connect', () => res()));

    // The rejection settles a microtask after the handshake; a short tick is
    // enough for the .catch to run.
    await new Promise<void>((res) => setTimeout(res, 50));

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1' }),
      'Failed to mark user online'
    );

    expect(connection.connected).toBe(true);

    connection.close();
  });

  it('lets a member join their room but rejects a non-member (IDOR guard)', async () => {
    const roomId = '6a687b3ec9ef189e9efd68b0';
    jest
      .spyOn(app.santaApi, 'getRoomById')
      .mockResolvedValue({ id: roomId, name: 'R', memberIds: ['u1'] });

    const member = connect(tokenFor('u1'));
    await new Promise<void>((res) => member.on('connect', () => res()));
    const okMember = await member.emitWithAck('join-room', roomId);
    expect(okMember).toEqual({ ok: true });
    member.close();

    const stranger = connect(tokenFor('u2'));
    await new Promise<void>((res) => stranger.on('connect', () => res()));
    const okStranger = await stranger.emitWithAck('join-room', roomId);
    expect(okStranger).toEqual({ ok: false });
    stranger.close();
  });
});
