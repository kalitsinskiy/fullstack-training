interface UserDetails {
  id: string;
  displayName: string;
  email: string;
}

interface RoomDetails {
  id: string;
  name: string;
  memberIds: string[];
}

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`santa-api responded with ${status}`);
    this.name = 'HttpError';
  }
}

// 4xx responses are deterministic client errors: retrying won't change the
// outcome, and they shouldn't be counted against the shared circuit breaker
// (a burst of bad ids must not open the circuit for healthy endpoints).
function isClientError(error: unknown): boolean {
  return error instanceof HttpError && error.status >= 400 && error.status < 500;
}

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeout: number = 30_000
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit is OPEN — request blocked');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      // Deterministic 4xx isn't a breaker failure — pass it through without
      // touching the circuit state so bad ids can't open it for healthy calls.
      if (isClientError(error)) throw error;
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Only 5xx / network / timeout errors are worth retrying; 4xx is final.
      if (attempt === maxRetries || isClientError(error)) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = delay * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }
  throw new Error('Unreachable');
}

class SantaApiClient {
  private readonly baseUrl: string;
  private readonly serviceKey: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(baseUrl: string, serviceKey: string) {
    this.baseUrl = baseUrl;
    this.serviceKey = serviceKey;
    this.circuitBreaker = new CircuitBreaker(5, 30_000);
  }

  async getUserById(userId: string): Promise<UserDetails> {
    return this.circuitBreaker.call(() =>
      withRetry(() => this.get<UserDetails>(`/api/internal/users/${userId}`))
    );
  }

  async getRoomById(roomId: string): Promise<RoomDetails> {
    return this.circuitBreaker.call(() =>
      withRetry(() => this.get<RoomDetails>(`/api/internal/rooms/${roomId}`))
    );
  }

  async getRelations(
    roomId: string,
    userId: string
  ): Promise<{ gifteeId: string | null; santaId: string | null }> {
    return this.circuitBreaker.call(() =>
      withRetry(() =>
        this.get<{ gifteeId: string | null; santaId: string | null }>(
          `/api/internal/rooms/${roomId}/relations/${userId}`
        )
      )
    );
  }

  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: { 'X-Service-Key': this.serviceKey },
        signal: controller.signal,
      });
      if (!res.ok) throw new HttpError(res.status);
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

let _client: SantaApiClient | null = null;
let _clientConfig: { baseUrl: string; serviceKey: string } | null = null;

export function getSantaApiClient(baseUrl?: string, serviceKey?: string): SantaApiClient {
  if (!_client) {
    const resolvedBaseUrl = baseUrl ?? process.env.SANTA_API_URL ?? 'http://localhost:3001';
    const resolvedServiceKey = serviceKey ?? process.env.SERVICE_API_KEY ?? '';
    _client = new SantaApiClient(resolvedBaseUrl, resolvedServiceKey);
    _clientConfig = { baseUrl: resolvedBaseUrl, serviceKey: resolvedServiceKey };
    return _client;
  }

  // The client is a singleton; reconfiguring it silently after the first call
  // would be a footgun, so surface a mismatch instead of ignoring the args.
  if (
    (baseUrl !== undefined && baseUrl !== _clientConfig!.baseUrl) ||
    (serviceKey !== undefined && serviceKey !== _clientConfig!.serviceKey)
  ) {
    throw new Error(
      'getSantaApiClient() was already initialized with different arguments; ' +
        'the client is a singleton and cannot be reconfigured'
    );
  }

  return _client;
}
