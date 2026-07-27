import { CircuitBreaker, CircuitOpenError } from '../src/services/circuit-breaker';
import { HttpAdapter, HttpError, RequestOptions } from '../src/services/http-adapter';
import { SantaApiClient } from '../src/services/santa-api-client';
import { withRetry } from '../src/services/retry';

class MockHttpAdapter implements HttpAdapter {
  readonly calls: { url: string; options?: RequestOptions }[] = [];

  constructor(private readonly responses: (() => Promise<unknown>)[]) {}

  get<T>(url: string, options?: RequestOptions): Promise<T> {
    this.calls.push({ url, options });
    const next = this.responses[Math.min(this.calls.length - 1, this.responses.length - 1)];
    return next() as Promise<T>;
  }

  post<T>(url: string): Promise<T> {
    throw new Error(`unexpected POST ${url}`);
  }
}

const ok = (body: unknown) => () => Promise.resolve(body);
const fails = (error: Error) => () => Promise.reject(error);

const ROOM = { id: 'r1', name: 'Office Party', memberIds: ['u1', 'u2'] };

describe('withRetry', () => {
  const noSleep = { sleep: () => Promise.resolve(), random: () => 0.5 };

  it('retries a transient failure and succeeds', async () => {
    let attempts = 0;
    const result = await withRetry(() => {
      attempts += 1;
      return attempts < 3 ? Promise.reject(new Error('blip')) : Promise.resolve('ok');
    }, noSleep);

    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('gives up after maxRetries and rethrows', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        () => {
          attempts += 1;
          return Promise.reject(new Error('always down'));
        },
        { ...noSleep, maxRetries: 2 }
      )
    ).rejects.toThrow('always down');

    expect(attempts).toBe(3); // the first try plus two retries
  });

  it('does not retry what cannot succeed', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        () => {
          attempts += 1;
          return Promise.reject(new HttpError(404, '/api/internal/rooms/r1'));
        },
        { ...noSleep, isRetryable: (error) => !(error instanceof HttpError) }
      )
    ).rejects.toThrow('responded with 404');

    expect(attempts).toBe(1);
  });
});

describe('CircuitBreaker', () => {
  it('opens after the failure threshold and blocks further calls', async () => {
    let clock = 0;
    const breaker = new CircuitBreaker(2, 30_000, () => clock);
    const boom = () => Promise.reject(new Error('down'));

    await expect(breaker.call(boom)).rejects.toThrow('down');
    await expect(breaker.call(boom)).rejects.toThrow('down');
    expect(breaker.currentState).toBe('OPEN');

    // Blocked without ever calling the remote service.
    let called = false;
    await expect(
      breaker.call(() => {
        called = true;
        return Promise.resolve('never');
      })
    ).rejects.toBeInstanceOf(CircuitOpenError);
    expect(called).toBe(false);

    // After the reset timeout one probe is allowed through and closes it.
    clock += 30_001;
    await expect(breaker.call(() => Promise.resolve('back'))).resolves.toBe('back');
    expect(breaker.currentState).toBe('CLOSED');
  });

  it('re-opens immediately when the half-open probe fails', async () => {
    let clock = 0;
    const breaker = new CircuitBreaker(1, 1_000, () => clock);

    await expect(breaker.call(() => Promise.reject(new Error('down')))).rejects.toThrow('down');
    clock += 1_001;
    await expect(breaker.call(() => Promise.reject(new Error('still down')))).rejects.toThrow(
      'still down'
    );

    expect(breaker.currentState).toBe('OPEN');
  });
});

describe('SantaApiClient', () => {
  const options = { baseUrl: 'http://santa-api:3001/', serviceKey: 'k' };

  it('calls the internal endpoint with the service key', async () => {
    const http = new MockHttpAdapter([ok(ROOM)]);
    const client = new SantaApiClient({ ...options, http });

    await expect(client.getRoomById('r1')).resolves.toEqual(ROOM);
    expect(http.calls[0].url).toBe('http://santa-api:3001/api/internal/rooms/r1');
    expect(http.calls[0].options?.headers).toEqual({ 'X-Service-Key': 'k' });
    expect(http.calls[0].options?.timeout).toBe(5_000);
  });

  it('retries a 500 then succeeds', async () => {
    const http = new MockHttpAdapter([fails(new HttpError(500, '/x')), ok(ROOM)]);
    const client = new SantaApiClient({ ...options, http });

    await expect(client.getRoomById('r1')).resolves.toEqual(ROOM);
    expect(http.calls).toHaveLength(2);
  });

  it('does not retry a 404', async () => {
    const http = new MockHttpAdapter([fails(new HttpError(404, '/x'))]);
    const client = new SantaApiClient({ ...options, http });

    await expect(client.getUserById('nope')).rejects.toThrow('responded with 404');
    expect(http.calls).toHaveLength(1);
  });

  it('stops calling a dead santa-api once the circuit opens', async () => {
    const http = new MockHttpAdapter([fails(new HttpError(503, '/x'))]);
    const client = new SantaApiClient({
      ...options,
      http,
      breaker: new CircuitBreaker(1, 30_000),
    });

    await expect(client.getRoomById('r1')).rejects.toThrow('responded with 503');
    const callsAfterFirst = http.calls.length;

    await expect(client.getRoomById('r1')).rejects.toBeInstanceOf(CircuitOpenError);
    expect(http.calls).toHaveLength(callsAfterFirst); // no further network traffic
  });
});
