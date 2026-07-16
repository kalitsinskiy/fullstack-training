import { createHmac } from 'crypto';
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: JwtPayload;
  }
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

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply
          .status(401)
          .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
      }

      try {
        request.user = verifyHs256(authHeader.slice(7), fastify.config.jwtSecret);
      } catch {
        return reply
          .status(401)
          .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
      }
    },
  );
}

export default fp(authPlugin, { name: 'auth', dependencies: ['config'] });
