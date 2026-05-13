import {
  Logger,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptors';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  const buildContext = (method: string, url: string): ExecutionContext => ({
    switchToHttp: () =>
      ({
        getRequest: () => ({ method, url }),
      }) as unknown as ExecutionContext,
  });

  const buildHandler = (value: unknown): CallHandler =>
    ({
      handle: () => of(value),
    }) as CallHandler;

  test('logs method, url and duration after the response stream completes', async () => {
    const context = buildContext('GET', '/users');
    const handler = buildHandler({ ok: true });

    const result = await lastValueFrom(interceptor.intercept(context, handler));

    expect(result).toEqual({ ok: true });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toMatch(/^GET \/users - \d+ms$/);
  });

  test('uses tap (not before next.handle) — log only fires on completion', async () => {
    const context = buildContext('GET', '/health');
    const handler = buildHandler('ok');

    const observable = interceptor.intercept(context, handler);
    expect(logSpy).not.toHaveBeenCalled(); // not yet — must subscribe first

    await lastValueFrom(observable);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  test('logs a warning when the controller throws', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const context = buildContext('GET', '/users/missing');
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('Warning - Missing User')),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, handler)),
    ).rejects.toThrow('Warning - Missing User');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(
      /^GET \/users\/missing — \d+ms - ERROR$/,
    );
    warnSpy.mockRestore();
  });
});
