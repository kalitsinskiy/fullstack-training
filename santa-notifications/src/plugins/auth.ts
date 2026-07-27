import { timingSafeEqual } from 'node:crypto';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { UnauthorizedError } from '../errors';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: AuthenticatedUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: preHandlerHookHandler;
    requireServiceKey: preHandlerHookHandler;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  const { jwtSecret, serviceApiKey } = fastify.config;

  await fastify.register(fastifyJwt, {
    secret: jwtSecret,
    verify: { algorithms: ['HS256'] },
    formatUser: (payload): AuthenticatedUser => ({
      id: payload.sub,
      email: payload.email,
      role: payload.role === 'admin' ? 'admin' : 'user',
    }),
  });

  const authenticate: preHandlerHookHandler = async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Missing, invalid, or expired token');
    }

    if (!request.user?.id) {
      throw new UnauthorizedError('Malformed token payload');
    }
  };

  const requireServiceKey: preHandlerHookHandler = async (request) => {
    const provided = request.headers['x-service-key'];
    if (typeof provided !== 'string') {
      throw new UnauthorizedError('Invalid service key');
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(serviceApiKey);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedError('Invalid service key');
    }
  };

  fastify.decorate('authenticate', authenticate);
  fastify.decorate('requireServiceKey', requireServiceKey);
}

export default fp(authPlugin, { name: 'auth', dependencies: ['config'] });

export function currentUser(request: FastifyRequest): AuthenticatedUser {
  if (!request.user?.id) {
    throw new UnauthorizedError();
  }
  return request.user;
}
