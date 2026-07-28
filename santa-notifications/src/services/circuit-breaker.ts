type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: State = 'CLOSED';
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly threshold = 5,
    private readonly resetMs = 30_000,
    private readonly now: () => number = Date.now
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.now() - this.openedAt < this.resetMs) {
        throw new Error('Circuit is OPEN — request blocked');
      }

      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();

      this.state = 'CLOSED';
      this.failures = 0;

      return result;
    } catch (err) {
      this.failures += 1;

      if (this.state === 'HALF_OPEN' || this.failures >= this.threshold) {
        this.state = 'OPEN';
        this.openedAt = this.now();
      }

      throw err;
    }
  }
}
