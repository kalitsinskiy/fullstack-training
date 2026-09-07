import { SantaApiClient, SantaApiError, isRetryableFailure } from './santa-api-client';

function makeClient() {
  return new SantaApiClient('https://santa-api.test', 'service-key');
}

function respondWith(status: number) {
  const fetchMock = jest.fn(async () =>
    status === 200
      ? new Response(JSON.stringify({ id: 'r1', name: 'Office Party', memberIds: [] }), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      : new Response(null, { status })
  );

  global.fetch = fetchMock as unknown as typeof fetch;

  return fetchMock;
}

describe('isRetryableFailure', () => {
  it('retries 5xx, timeouts and network errors, but not ordinary 4xx', () => {
    expect(isRetryableFailure(new SantaApiError('/x', 500))).toBe(true);
    expect(isRetryableFailure(new SantaApiError('/x', 503))).toBe(true);
    expect(isRetryableFailure(new SantaApiError('/x', 408))).toBe(true);
    expect(isRetryableFailure(new SantaApiError('/x', 429))).toBe(true);

    expect(isRetryableFailure(new SantaApiError('/x', 404))).toBe(false);
    expect(isRetryableFailure(new SantaApiError('/x', 400))).toBe(false);
    expect(isRetryableFailure(new SantaApiError('/x', 403))).toBe(false);

    expect(isRetryableFailure(new Error('fetch failed'))).toBe(true);
  });
});

describe('SantaApiClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('fails a 404 on the first attempt instead of retrying', async () => {
    const fetchMock = respondWith(404);

    await expect(makeClient().getRoomById('r1')).rejects.toThrow(SantaApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not let a burst of 404s open the breaker for healthy calls', async () => {
    const client = makeClient();
    const fetchMock = respondWith(404);

    for (let i = 0; i < 10; i += 1) {
      await expect(client.getRoomById(`r${i}`)).rejects.toThrow(/404/);
    }

    respondWith(200);

    await expect(client.getRoomById('alive')).resolves.toMatchObject({ name: 'Office Party' });
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });

  it('retries a 500 before giving up', async () => {
    jest.useFakeTimers();

    const fetchMock = respondWith(500);
    const pending = makeClient().getRoomById('r1');
    const assertion = expect(pending).rejects.toThrow(/500/);

    await jest.advanceTimersByTimeAsync(10_000);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
