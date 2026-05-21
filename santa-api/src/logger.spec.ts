import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

describe('AppModule - Pino Logger wiring', () => {
  test('Logger from nestjs-pino is available in the DI container', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const logger = moduleRef.get(Logger, { strict: false });

    expect(logger).toBeDefined();
    expect(typeof logger.log).toBe('function');
  });
});
