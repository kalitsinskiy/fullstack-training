import { CircuitBreaker, withRetry } from './circuit-breaker';

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
  gifteeId: string | null; // who the user gives to
  santaId: string | null; // who gives to the user (never exposed to the giftee)
}

/**
 * Synchronous HTTP client for santa-api's /internal endpoints. Authenticated
 * with the shared X-Service-Key, wrapped in retry (transient) + a circuit
 * breaker (sustained outage) + a request timeout.
 */
export class SantaApiClient {
  private readonly breaker = new CircuitBreaker(5, 30_000);

  constructor(
    private readonly baseUrl: string,
    private readonly serviceKey: string,
  ) {}

  getUserById(id: string): Promise<UserDetails> {
    return this.breaker.call(() =>
      withRetry(() => this.get<UserDetails>(`/api/internal/users/${id}`)),
    );
  }

  getRoomById(id: string): Promise<RoomDetails> {
    return this.breaker.call(() =>
      withRetry(() => this.get<RoomDetails>(`/api/internal/rooms/${id}`)),
    );
  }

  /**
   * The caller's two messaging relationships in a room: their giftee (who they
   * give to) and their Secret Santa (who gives to them). Resolved server-side
   * via the service key so the santaId can be used for routing without ever
   * being sent to the giftee's client.
   */
  getRelations(roomId: string, userId: string): Promise<RoomRelations> {
    return this.breaker.call(() =>
      withRetry(() =>
        this.get<RoomRelations>(
          `/api/internal/rooms/${roomId}/relations/${userId}`,
        ),
      ),
    );
  }

  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: { 'X-Service-Key': this.serviceKey },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`santa-api ${path} responded ${res.status}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
