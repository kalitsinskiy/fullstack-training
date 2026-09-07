import { randomBytes } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';
import { Room } from '../../src/rooms/schemas/room.schema';
import {
  clearAllCollections,
  startInMemoryMongo,
  stopInMemoryMongo,
} from '../setup-mongo';

const REQUIRED_SECRET_KEYS = ['JWT_SECRET', 'SERVICE_API_KEY'] as const;

export interface TestApp {
  getApp: () => NestFastifyApplication;
  serviceKey: string;
}

export function useTestApp(): TestApp {
  let app: NestFastifyApplication;
  const saved: Record<string, string | undefined> = {};
  const secrets: Record<string, string> = {};

  for (const key of REQUIRED_SECRET_KEYS) {
    secrets[key] = process.env[key] ?? randomBytes(24).toString('hex');
  }

  beforeAll(async () => {
    for (const [key, value] of Object.entries(secrets)) {
      saved[key] = process.env[key];
      process.env[key] = value;
    }

    saved.MONGO_URL = process.env.MONGO_URL;
    process.env.MONGO_URL = await startInMemoryMongo();
  });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    await app.get<Model<Room>>(getModelToken(Room.name)).syncIndexes();
  });

  afterEach(async () => {
    if (app) {
      const connection = app.get<Connection>(getConnectionToken());
      await clearAllCollections(connection);
      await app.close();
    }
  });

  afterAll(async () => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }

    await stopInMemoryMongo();
  });

  return { getApp: () => app, serviceKey: secrets.SERVICE_API_KEY };
}
