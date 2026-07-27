export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  isRetryable?: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 200,
    isRetryable = () => true,
    sleep = defaultSleep,
    random = Math.random,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !isRetryable(error)) throw error;

      const delay = baseDelay * 2 ** attempt;
      await sleep(delay * (0.5 + random() * 0.5));
    }
  }

  throw lastError;
}
