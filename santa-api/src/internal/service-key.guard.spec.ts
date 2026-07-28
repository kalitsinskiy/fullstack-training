import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ServiceKeyGuard } from './service-key.guard';
import { ConfigService } from '@nestjs/config';

function ctxWithKey(key?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: key ? { 'x-service-key': key } : {} }),
    }),
  } as unknown as ExecutionContext;
}

function makeGuard(expected = 'secret'): ServiceKeyGuard {
  return new ServiceKeyGuard({
    getOrThrow: () => expected,
  } as unknown as ConfigService);
}

describe('ServiceKeyGuard', () => {
  it('allows a request with the correct key', () => {
    expect(makeGuard('secret').canActivate(ctxWithKey('secret'))).toBe(true);
  });

  it('rejects a wrong key', () => {
    expect(() => makeGuard('secret').canActivate(ctxWithKey('nope'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects missing key', () => {
    expect(() =>
      makeGuard('secret').canActivate(ctxWithKey(undefined)),
    ).toThrow(UnauthorizedException);
  });
});
