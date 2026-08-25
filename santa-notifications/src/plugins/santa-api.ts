import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { SantaApi, SantaApiClient } from '../services/santa-api-client';

declare module 'fastify' {
  interface FastifyInstance {
    santaApi: SantaApi;
  }
}

export interface SantaApiPluginOptions {
  santaApi?: SantaApi;
}

async function santaApiPlugin(
  fastify: FastifyInstance,
  options: SantaApiPluginOptions
): Promise<void> {
  const santaApi =
    options.santaApi ??
    new SantaApiClient({
      baseUrl: fastify.config.santaApiUrl,
      serviceKey: fastify.config.serviceApiKey,
    });

  fastify.decorate('santaApi', santaApi);
}

export default fp(santaApiPlugin, { name: 'santa-api', dependencies: ['config'] });
