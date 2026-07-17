import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createHmac } from 'crypto';
import type { Server as HttpServer } from 'http';
import type Redis from 'ioredis';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

function verifyHs256(token: string, secret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT structure');

  const [headerB64, payloadB64, sigB64] = parts;
  const expected = createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  if (expected !== sigB64) throw new Error('Invalid JWT signature');

  const payload = JSON.parse(
    Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
  ) as JwtPayload;

  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('JWT expired');

  return payload;
}

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

    socket.on('join-room', (roomId: string) => {
      if (typeof roomId === 'string' && roomId.length > 0) {
        socket.join(`room:${roomId}`);
      }
    });

    socket.on('leave-room', (roomId: string) => {
      if (typeof roomId === 'string') {
        socket.leave(`room:${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}
