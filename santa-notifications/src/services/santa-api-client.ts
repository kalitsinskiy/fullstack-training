import { CircuitBreaker } from './circuit-breaker';
import { FetchHttpAdapter, HttpAdapter, HttpError } from './http-adapter';
import { withRetry } from './retry';

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

/**
 * A user's two relationships in a room. Both are null before the draw.
 * `santaId` is for routing only — it must never reach a client.
 */
export interface RoomRelations {
  gifteeId: string | null;
  santaId: string | null;
}

export interface SantaApi {
  getUserById(userId: string): Promise<UserDetails>;
  getRoomById(roomId: string): Promise<RoomDetails>;
  getRelations(roomId: string, userId: string): Promise<RoomRelations>;
}

export interface SantaApiClientOptions {
  baseUrl: string;
  serviceKey: string;
  http?: HttpAdapter;
  timeout?: number;
  breaker?: CircuitBreaker;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 500 || error.status === 429;
  }
  return true;
}

/**
 * A deterministic 4xx (e.g. a stale room id) reflects the caller's input, not
 * santa-api's health — counting it would let a run of legitimate 404s trip
 * the breaker and block healthy calls. 429 still counts: it reflects real
 * backend distress (the caller is being rate-limited).
 */
function countsTowardBreaker(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 500 || error.status === 429;
  }
  return true;
}

export class SantaApiClient implements SantaApi {
  private readonly baseUrl: string;
  private readonly serviceKey: string;
  private readonly http: HttpAdapter;
  private readonly timeout: number;
  private readonly breaker: CircuitBreaker;

  constructor(options: SantaApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.serviceKey = options.serviceKey;
    this.http = options.http ?? new FetchHttpAdapter();
    this.timeout = options.timeout ?? 5_000;
    this.breaker = options.breaker ?? new CircuitBreaker(5, 30_000);
  }

  getUserById(userId: string): Promise<UserDetails> {
    return this.get<UserDetails>(`/api/internal/users/${userId}`);
  }

  getRoomById(roomId: string): Promise<RoomDetails> {
    return this.get<RoomDetails>(`/api/internal/rooms/${roomId}`);
  }

  getRelations(roomId: string, userId: string): Promise<RoomRelations> {
    return this.get<RoomRelations>(`/api/internal/rooms/${roomId}/relations/${userId}`);
  }

  private get<T>(path: string): Promise<T> {
    return this.breaker.call(
      () =>
        withRetry(
          () =>
            this.http.get<T>(`${this.baseUrl}${path}`, {
              headers: { 'X-Service-Key': this.serviceKey },
              timeout: this.timeout,
            }),
          { isRetryable }
        ),
      countsTowardBreaker
    );
  }
}
