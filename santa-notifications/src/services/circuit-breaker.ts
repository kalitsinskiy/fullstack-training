export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitOpenError extends Error {
  constructor(public readonly retryInMs: number) {
    super('Circuit is OPEN — request blocked');
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly threshold = 5,
    private readonly resetTimeout = 30_000,
    private readonly now: () => number = Date.now
  ) {}

  get currentState(): CircuitState {
    return this.state;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const elapsed = this.now() - this.lastFailureTime;
      if (elapsed <= this.resetTimeout) {
        throw new CircuitOpenError(this.resetTimeout - elapsed);
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount += 1;
    this.lastFailureTime = this.now();
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
