import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { SantaApiClient } from '../services/santa-api-client';

declare module 'fastify' {
  interface FastifyInstance {
    santaApi: SantaApiClient;
  }
}

/**
 * Decorates `fastify.santaApi`. Must run AFTER `config` so `fastify.config` is
 * populated — hence `dependencies: ['config']` (decorating in buildApp directly
 * reads `app.config` before it exists).
 */
async function santaApiPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorate(
    'santaApi',
    new SantaApiClient(fastify.config.santaApiUrl, fastify.config.serviceKey),
  );
}

export default fp(santaApiPlugin, { name: 'santa-api', dependencies: ['config'] });
