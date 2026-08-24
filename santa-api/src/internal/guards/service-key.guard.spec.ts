import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceKeyGuard } from './service-key.guard';

function makeContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('ServiceKeyGuard', () => {
  const mockConfig = { get: jest.fn() };
  let guard: ServiceKeyGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ServiceKeyGuard(mockConfig as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('returns true when the key matches', () => {
    mockConfig.get.mockReturnValue('secret-key');
    const ctx = makeContext({ 'x-service-key': 'secret-key' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws UnauthorizedException when the key is wrong', () => {
    mockConfig.get.mockReturnValue('secret-key');
    const ctx = makeContext({ 'x-service-key': 'wrong-key' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the key header is missing', () => {
    mockConfig.get.mockReturnValue('secret-key');
    const ctx = makeContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when SERVICE_API_KEY is not configured', () => {
    mockConfig.get.mockReturnValue(undefined);
    const ctx = makeContext({ 'x-service-key': 'any-key' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
