/**
 * Circuit breaker — stops hammering a failing dependency. After `threshold`
 * consecutive failures it OPENS (fails fast) for `resetTimeout` ms, then probes
 * once (HALF_OPEN) before closing again.
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly threshold = 5,
    private readonly resetTimeout = 30_000,
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
      this.failureCount = 0;
      this.state = 'CLOSED';
      return result;
    } catch (err) {
      this.failureCount += 1;
      this.lastFailureTime = Date.now();
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
      }
      throw err;
    }
  }
}

/** Retry with exponential backoff + jitter (transient failures self-heal). */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxRetries = 3, baseDelay = 300 }: { maxRetries?: number; baseDelay?: number } = {},
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * 2 ** attempt;
      const jitter = delay * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }
  throw new Error('unreachable');
}
