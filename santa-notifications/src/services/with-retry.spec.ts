import { withRetry } from './with-retry';

const noSleep = () => Promise.resolve();

describe('withRetry', () => {
  it('retries then succeeds on a later attempt', async () => {
    let calls = 0;

    const fn = jest.fn(async () => {
      calls += 1;

      if (calls < 3) {
        throw new Error('transient');
      }

      return 'ok';
    });

    await expect(withRetry(fn, { sleep: noSleep, random: () => 0 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('gives up immediately when shouldRetry rejects the error', async () => {
    const fn = jest.fn(() => Promise.reject(new Error('deterministic')));

    await expect(withRetry(fn, { sleep: noSleep, shouldRetry: () => false })).rejects.toThrow(
      'deterministic'
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws the last error after exhausting maxRetries', async () => {
    const fn = jest.fn(() => Promise.reject(new Error('always')));

    await expect(withRetry(fn, { maxRetries: 2, sleep: noSleep })).rejects.toThrow('always');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
