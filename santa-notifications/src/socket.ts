import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server as HttpServer } from 'http';
import type Redis from 'ioredis';
import { getSantaApiClient } from './services/santa-api-client';
import { verifyHs256 } from './utils/jwt';

export async function createSocketServer(
  httpServer: HttpServer,
  redisClient: Redis,
  options: { corsOrigin: string | string[]; jwtSecret: string },
) {
  const io = new Server(httpServer, {
    cors: {
      origin: options.corsOrigin,
      credentials: true,
    },
  });

  // ioredis auto-connects on instantiation — no .connect() call needed.
  // Duplicate both so the main fastify.redis stays free for cache/presence ops,
  // and the sub client can enter subscriber mode without conflict.
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication token required'));

    try {
      socket.data.user = verifyHs256(token, options.jwtSecret);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.sub as string;
    socket.join(`user:${userId}`);
    void redisClient.sadd('online:users', userId);

    socket.on('join-room', async (roomId: string, ack?: (ok: boolean) => void) => {
      if (typeof roomId !== 'string' || !roomId.length) {
        ack?.(false);
        return;
      }
      try {
        const room = await getSantaApiClient().getRoomById(roomId);
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

    socket.on('leave-room', (roomId: string) => {
      if (typeof roomId === 'string') {
        socket.leave(`room:${roomId}`);
      }
    });

    socket.on('disconnect', async () => {
      // Only remove from the set when the user has no remaining open sockets
      // (multi-tab safe: socket rooms use the user:{id} room to count active connections)
      const remainingSockets = await io.in(`user:${userId}`).fetchSockets();
      if (remainingSockets.length === 0) {
        await redisClient.srem('online:users', userId);
      }
    });
  });

  return io;
}
