export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

export interface HttpAdapter {
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(url: string, body: unknown, options?: RequestOptions): Promise<T>;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string
  ) {
    super(`${url} responded with ${status}`);
    this.name = 'HttpError';
  }
}

const DEFAULT_TIMEOUT_MS = 5_000;

export class FetchHttpAdapter implements HttpAdapter {
  get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.send<T>(url, { method: 'GET', headers: options.headers }, options.timeout);
  }

  post<T>(url: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    return this.send<T>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: JSON.stringify(body),
      },
      options.timeout
    );
  }

  private async send<T>(url: string, init: RequestInit, timeout?: number): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!response.ok) throw new HttpError(response.status, url);
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
