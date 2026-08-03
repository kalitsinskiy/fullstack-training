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
    return this.breaker.call(() => withRetry(() => this.fetchJson<T>(path)));
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
        throw new Error(`santa-api ${path} -> ${res.status}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
