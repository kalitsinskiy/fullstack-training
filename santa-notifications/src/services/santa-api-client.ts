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

export interface SantaApi {
  getUserById(userId: string): Promise<UserDetails>;
  getRoomById(roomId: string): Promise<RoomDetails>;
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

  private get<T>(path: string): Promise<T> {
    return this.breaker.call(() =>
      withRetry(
        () =>
          this.http.get<T>(`${this.baseUrl}${path}`, {
            headers: { 'X-Service-Key': this.serviceKey },
            timeout: this.timeout,
          }),
        { isRetryable }
      )
    );
  }
}
