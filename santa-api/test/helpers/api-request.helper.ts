import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyInstance, InjectOptions } from 'fastify';

export interface InjectedResponse<T> {
  statusCode: number;
  body: T;
}

function parseBody<T>(payload: string): T {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return payload as unknown as T;
  }
}

async function inject<T>(
  app: NestFastifyApplication,
  options: InjectOptions,
): Promise<InjectedResponse<T>> {
  const fastify: FastifyInstance = app.getHttpAdapter().getInstance();
  const res = await fastify.inject(options);
  return { statusCode: res.statusCode, body: parseBody<T>(res.payload) };
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

export const get = <T = unknown>(app: NestFastifyApplication, url: string) =>
  inject<T>(app, { method: 'GET', url });

export const post = <T = unknown>(
  app: NestFastifyApplication,
  url: string,
  payload?: string | object,
) => inject<T>(app, { method: 'POST', url, payload });

export const patch = <T = unknown>(
  app: NestFastifyApplication,
  url: string,
  payload?: string | object,
) => inject<T>(app, { method: 'PATCH', url, payload });

export const authedGet = <T = unknown>(
  app: NestFastifyApplication,
  url: string,
  token: string,
) => inject<T>(app, { method: 'GET', url, headers: bearer(token) });

export const authedPost = <T = unknown>(
  app: NestFastifyApplication,
  url: string,
  token: string,
  payload?: string | object,
) => inject<T>(app, { method: 'POST', url, payload, headers: bearer(token) });

export const authedPatch = <T = unknown>(
  app: NestFastifyApplication,
  url: string,
  token: string,
  payload?: string | object,
) => inject<T>(app, { method: 'PATCH', url, payload, headers: bearer(token) });
