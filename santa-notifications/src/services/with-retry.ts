export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  shouldRetry?: (err: unknown) => boolean;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 200,
    sleep = defaultSleep,
    random = Math.random,
    shouldRetry = () => true,
  } = opts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries || !shouldRetry(err)) throw err;

      const delay = baseDelayMs * 2 ** attempt;
      const jittered = delay * (0.5 + random() * 0.5);

      await sleep(jittered);
    }
  }

  throw new Error('unreachable');
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
