import { createAdapter } from '@socket.io/redis-adapter';
import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { markOffline, markOnline } from './online-users';
import { Types } from 'mongoose';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function createSocketServer(app: FastifyInstance): Server {
  const io = new Server(app.server, {
    path: '/socket.io',
    cors: { origin: app.config.corsOrigin, credentials: true },
  });

  const pub = app.redis.duplicate();
  const sub = app.redis.duplicate();

  io.adapter(createAdapter(pub, sub));

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = app.jwt.verify<JwtPayload>(token);

      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;

    socket.join(`user:${userId}`);
    void markOnline(app.redis, userId);

    socket.on('join-room', async (roomId: string, ack?: (r: { ok: boolean }) => void) => {
      if (!Types.ObjectId.isValid(roomId)) {
        return ack?.({ ok: false });
      }

      try {
        const room = await app.santaApi.getRoomById(roomId);

        if (!room.memberIds.includes(userId)) {
          return ack?.({ ok: false });
        }

        await socket.join(`room:${roomId}`);

        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    socket.on('leave-room', (roomId: string) => {
      void socket.leave(`room:${roomId}`);
    });

    socket.on('disconnect', () => {
      void markOffline(app.redis, userId);
    });
  });

  return io;
}
