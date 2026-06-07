import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Connection } from 'mongoose';
import { createTestApp } from './helpers/test-app.helper';
import { get } from './helpers/api-request.helper';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;
  let connection: Connection;

  beforeAll(() => {
    process.env.JWT_SECRET = 'app-e2e-test-secret';
  });

  beforeEach(async () => {
    ({ app, connection } = await createTestApp());
    await connection.dropDatabase();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const res = await get(app, '/');

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('Hello World!');
  });
});
