import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';

const noopThrottlerStorage = {
  increment: () =>
    Promise.resolve({
      totalHits: 1,
      timeToExpire: 60000,
      isBlocked: false,
      timeToBlockExpire: 0,
    }),
};

export interface TestApp {
  app: NestFastifyApplication;
  moduleRef: TestingModule;
  connection: Connection;
}

export interface CreateTestAppOptions {
  globalPrefix?: string;
  validation?: boolean;
}

export async function createTestApp(
  options: CreateTestAppOptions = {},
): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ThrottlerStorage)
    .useValue(noopThrottlerStorage)
    .compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false }),
  );

  if (options.validation) {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
  }

  if (options.globalPrefix) {
    app.setGlobalPrefix(options.globalPrefix);
  }

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const connection = moduleRef.get<Connection>(getConnectionToken());

  return { app, moduleRef, connection };
}
