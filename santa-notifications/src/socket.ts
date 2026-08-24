import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { Server as HttpServer } from 'http';
import type { FastifyBaseLogger } from 'fastify';
import { getSantaApiClient } from './services/santa-api-client';

type VerifyToken = (token: string) => { sub: string; [key: string]: unknown };

export async function createSocketServer(
  httpServer: HttpServer,
  verifyToken: VerifyToken,
  logger: FastifyBaseLogger
): Promise<Server> {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : ['http://localhost:5173'],
      credentials: true,
    },
  });

  // Redis adapter for horizontal scaling
  const pubClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  const subClient = pubClient.duplicate();
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      pubClient.on('ready', resolve);
      pubClient.on('error', reject);
    }),
    new Promise<void>((resolve, reject) => {
      subClient.on('ready', resolve);
      subClient.on('error', reject);
    }),
  ]);
  io.adapter(createAdapter(pubClient, subClient));
  logger.info('Socket.IO Redis adapter connected');

  // JWT authentication middleware — runs before 'connection' fires
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      logger.debug('socket auth rejected: no token');
      return next(new Error('Authentication token required'));
    }
    try {
      socket.data.user = verifyToken(token);
      next();
    } catch (err) {
      logger.debug({ err }, 'socket auth rejected: invalid token');
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket.data.user as { sub: string }).sub;

    // Personal room — used for direct user notifications
    socket.join(`user:${userId}`);
    logger.debug({ userId }, 'socket connected');

    socket.on('join-room', async (roomId: string) => {
      if (typeof roomId !== 'string' || !roomId) return;
      const client = getSantaApiClient();
      try {
        const roomDetails = await client.getRoomById(roomId);
        if (!roomDetails.memberIds.includes(userId)) {
          logger.debug({ userId, roomId }, 'socket join denied: not a member');
          socket.emit('error', { message: 'Not authorized for this room' });
          return;
        }
      } catch (err) {
        logger.warn({ err, userId, roomId }, 'failed to verify room membership');
        socket.emit('error', { message: 'Could not verify user membership' });
        return;
      }
      socket.join(`room:${roomId}`);
      logger.debug({ userId, roomId }, 'socket joined room');
    });

    socket.on('leave-room', (roomId: string) => {
      if (typeof roomId !== 'string' || !roomId) return;
      socket.leave(`room:${roomId}`);
      logger.debug({ userId, roomId }, 'socket left room');
    });

    socket.on('disconnect', () => {
      logger.debug({ userId }, 'socket disconnected');
    });
  });

  return io;
}
