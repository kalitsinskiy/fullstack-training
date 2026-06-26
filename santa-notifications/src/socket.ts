import type { Server as HttpServer } from 'http';
import type { FastifyBaseLogger } from 'fastify';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import type { SantaApiClient } from './services/santa-api-client';

const ONLINE_USERS_KEY = 'online:users';
const OBJECT_ID = /^[a-f0-9]{24}$/i;

interface SocketOpts {
  jwtSecret: string;
  redisUrl: string;
  corsOrigin: string[];
  api: SantaApiClient;
  log: FastifyBaseLogger;
}

// Socket.IO server sharing Fastify's HTTP server: JWT handshake auth, a personal
// `user:{id}` room for direct pushes, online-user presence, and a Redis adapter
// so broadcasts work across multiple instances.
export function createSocketServer(httpServer: HttpServer, opts: SocketOpts): Server {
  const io = new Server(httpServer, {
    cors: { origin: opts.corsOrigin, credentials: true },
  });

  const pub = new Redis(opts.redisUrl);
  const sub = pub.duplicate();
  io.adapter(createAdapter(pub, sub));

  // Authenticate the handshake — same JWT santa-api issues.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication token required'));
    try {
      const payload = jwt.verify(token, opts.jwtSecret) as { sub: string };
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  const presence = new Redis(opts.redisUrl);
  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    // Track this socket; a user is "online" while ANY of their sockets is open
    // (handles multiple tabs and unclean disconnects correctly).
    void (async () => {
      await presence.sadd(`presence:${userId}`, socket.id);
      await presence.sadd(ONLINE_USERS_KEY, userId);
    })();
    opts.log.info({ userId }, 'WS connected');

    // Only let a user subscribe to a room channel if they're actually a member —
    // otherwise anyone could listen to any room's events (IDOR).
    socket.on('join-room', async (roomId: string, ack?: (ok: boolean) => void) => {
      if (typeof roomId !== 'string' || !OBJECT_ID.test(roomId)) {
        ack?.(false);
        return;
      }
      try {
        const room = await opts.api.getRoomById(roomId);
        if (!room.memberIds.includes(userId)) {
          ack?.(false);
          return;
        }
        socket.join(`room:${roomId}`);
        ack?.(true);
      } catch {
        ack?.(false);
      }
    });
    socket.on('leave-room', (roomId: string) => socket.leave(`room:${roomId}`));

    socket.on('disconnect', () => {
      void (async () => {
        await presence.srem(`presence:${userId}`, socket.id);
        const remaining = await presence.scard(`presence:${userId}`);
        if (remaining === 0) {
          await presence.srem(ONLINE_USERS_KEY, userId);
        }
        opts.log.info({ userId }, 'WS disconnected');
      })();
    });
  });

  return io;
}
