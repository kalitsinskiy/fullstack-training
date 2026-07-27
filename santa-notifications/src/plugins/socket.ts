import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import type { Server } from 'socket.io';
import { createRealtimePublisher, noopRealtimePublisher, RealtimePublisher } from '../realtime';
import { SantaApiClient } from '../services/santa-api-client';
import { createSocketServer } from '../socket';
import type { JwtPayload } from './auth';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server | null;
    realtime: RealtimePublisher;
  }
}

function corsOrigins(): string[] {
  return process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'];
}

async function socketPlugin(fastify: FastifyInstance) {
  if (fastify.config.env === 'test') {
    fastify.decorate('io', null);
    fastify.decorate('realtime', noopRealtimePublisher);
    fastify.log.info('NODE_ENV=test — Socket.IO server not started');
    return;
  }

  const api = new SantaApiClient({
    baseUrl: fastify.config.santaApiUrl,
    serviceKey: fastify.config.serviceApiKey,
  });

  const { io, close } = await createSocketServer({
    httpServer: fastify.server,
    corsOrigins: corsOrigins(),
    redisUrl: fastify.config.redisUrl,
    useRedisAdapter: true,
    verifyToken: (token) => fastify.jwt.verify<JwtPayload>(token),
    presence: fastify.presence,
    api,
    log: fastify.log,
  });

  fastify.decorate('io', io);
  fastify.decorate('realtime', createRealtimePublisher(io));

  fastify.addHook('onClose', async () => {
    await close();
  });

  fastify.log.info('Socket.IO server attached');
}

export default fp(socketPlugin, {
  name: 'socket',
  dependencies: ['config', 'auth', 'presence'],
});
