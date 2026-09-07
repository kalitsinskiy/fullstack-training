import { CircuitBreaker } from './circuit-breaker';
import { withRetry } from './with-retry';

export interface UserDetails {
  id: string;
  displayName: string;
  email: string;
}

export interface RoomDetails {
  id: string;
  name: string;
  memberIds: string[];
}

export interface RoomRelations {
  gifteeId: string | null;
  santaId: string | null;
}

export class SantaApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number
  ) {
    super(`santa-api ${path} -> ${status}`);
    this.name = 'SantaApiError';
  }

  /**
   * 4xx is the server telling us the request itself is wrong (a deleted room,
   * a bad id, a rejected service key) — repeating it gets the same answer, and
   * counting it as a santa-api outage would open the breaker for healthy calls.
   * 408/429 are the exceptions: those do clear on their own.
   */
  get retryable(): boolean {
    if (this.status === 408 || this.status === 429) return true;

    return this.status >= 500;
  }
}

export function isRetryableFailure(err: unknown): boolean {
  return err instanceof SantaApiError ? err.retryable : true;
}

export class SantaApiClient {
  private readonly breaker = new CircuitBreaker(5, 30_000);

  constructor(
    private readonly baseUrl: string,
    private readonly serviceKey: string,
    private readonly timeoutMs = 5_000
  ) {}

  getUserById(id: string): Promise<UserDetails> {
    return this.request<UserDetails>(`/api/internal/users/${id}`);
  }

  getRoomById(id: string): Promise<RoomDetails> {
    return this.request<RoomDetails>(`/api/internal/rooms/${id}`);
  }

  getRelations(roomId: string, userId: string): Promise<RoomRelations> {
    return this.request<RoomRelations>(`/api/internal/rooms/${roomId}/relations/${userId}`);
  }

  private request<T>(path: string): Promise<T> {
    return this.breaker.call(
      () => withRetry(() => this.fetchJson<T>(path), { shouldRetry: isRetryableFailure }),
      isRetryableFailure
    );
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: { 'X-Service-Key': this.serviceKey },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new SantaApiError(path, res.status);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
