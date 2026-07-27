import type { Server as HttpServer } from 'node:http';
import type { FastifyBaseLogger } from 'fastify';
import Redis from 'ioredis';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { JwtPayload } from './plugins/auth';
import type { PresenceStore } from './presence/store';
import { santaRoom, userRoom } from './realtime';
import type { SantaApi } from './services/santa-api-client';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

interface JoinAck {
  ok: boolean;
  error?: string;
}

type AckCallback = (ack: JoinAck) => void;

export interface SocketServerHandle {
  io: Server;
  close(): Promise<void>;
}

export interface SocketServerOptions {
  httpServer: HttpServer;
  corsOrigins: string[];
  redisUrl: string;
  useRedisAdapter: boolean;
  verifyToken(token: string): JwtPayload;
  presence: PresenceStore;
  api: SantaApi;
  log: FastifyBaseLogger;
}

declare module 'socket.io' {
  interface SocketData {
    userId: string;
    email: string;
    role: 'user' | 'admin';
  }
}

function ackWith(callback: unknown, ack: JoinAck): void {
  if (typeof callback === 'function') {
    (callback as AckCallback)(ack);
  }
}

export async function createSocketServer(
  options: SocketServerOptions
): Promise<SocketServerHandle> {
  const { httpServer, corsOrigins, verifyToken, presence, api, log } = options;

  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  const redisClients: Redis[] = [];

  if (options.useRedisAdapter) {
    const pubClient = new Redis(options.redisUrl, { maxRetriesPerRequest: 3 });
    const subClient = pubClient.duplicate();
    redisClients.push(pubClient, subClient);

    for (const client of redisClients) {
      client.on('error', (error: Error) =>
        log.error({ err: error }, 'Socket.IO Redis adapter error')
      );
    }

    io.adapter(createAdapter(pubClient, subClient));
    log.info('Socket.IO Redis adapter enabled');
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      next(new Error('Authentication token required'));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      socket.data.role = payload.role === 'admin' ? 'admin' : 'user';
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;

    void socket.join(userRoom(userId));
    void presence
      .addConnection(userId, socket.id)
      .catch((error: Error) => log.error({ err: error, userId }, 'Failed to record presence'));

    log.info({ userId, socketId: socket.id }, 'Socket connected');

    socket.on('join-room', (roomId: unknown, callback?: unknown) => {
      void (async () => {
        if (typeof roomId !== 'string' || !OBJECT_ID_PATTERN.test(roomId)) {
          ackWith(callback, { ok: false, error: 'Invalid room id' });
          return;
        }

        try {
          const room = await api.getRoomById(roomId);

          if (!room.memberIds.includes(userId)) {
            log.warn({ userId, roomId }, 'Rejected join-room for a non-member');
            ackWith(callback, { ok: false, error: 'Not a member of this room' });
            return;
          }

          await socket.join(santaRoom(roomId));
          ackWith(callback, { ok: true });
        } catch (error) {
          log.error({ err: error, userId, roomId }, 'Could not authorize join-room');
          ackWith(callback, { ok: false, error: 'Could not join room' });
        }
      })();
    });

    socket.on('leave-room', (roomId: unknown) => {
      if (typeof roomId !== 'string') return;
      void socket.leave(santaRoom(roomId));
    });

    socket.on('disconnect', (reason) => {
      void presence
        .removeConnection(userId, socket.id)
        .then((wentOffline) =>
          log.info({ userId, socketId: socket.id, reason, wentOffline }, 'Socket disconnected')
        )
        .catch((error: Error) => log.error({ err: error, userId }, 'Failed to clear presence'));
    });
  });

  async function close(): Promise<void> {
    io.disconnectSockets(true);
    io.engine.close();
    await Promise.all(redisClients.map((client) => client.quit()));
  }

  return { io, close };
}
