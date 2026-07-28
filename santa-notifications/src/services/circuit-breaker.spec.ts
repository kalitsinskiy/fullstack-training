import { CircuitBreaker } from './circuit-breaker';

const fail = () => Promise.reject(new Error('Ooops'));
const ok = () => Promise.resolve('ok');

describe('CircuitBreaker', () => {
  it('opens after the failure threshold and then blocks calls', async () => {
    const cb = new CircuitBreaker(3, 1000, () => 0);

    for (let i = 0; i < 3; i += 1) {
      await expect(cb.call(fail)).rejects.toThrow('Ooops');
    }

    await expect(cb.call(ok)).rejects.toThrow(/Circuit is OPEN/);
  });

  it('half-opens after resetMs and closes on a successful probe', async () => {
    let clock = 0;
    const cb = new CircuitBreaker(1, 1000, () => clock);

    await expect(cb.call(fail)).rejects.toThrow();

    clock = 1001;

    await expect(cb.call(ok)).resolves.toBe('ok');
    await expect(cb.call(ok)).resolves.toBe('ok');
  });
});
