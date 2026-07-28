import { vi } from 'vitest';

type Handler = (...args: unknown[]) => void;

export function createMockSocket() {
  const handlers = new Map<string, Set<Handler>>();
  const socket = {
    on: vi.fn((event: string, cb: Handler) => {
      (handlers.get(event) ?? handlers.set(event, new Set()).get(event)!).add(
        cb,
      );
    }),
    off: vi.fn((event: string, cb: Handler) => handlers.get(event)?.delete(cb)),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(() => handlers.clear()),
  };

  const server = (event: string, ...args: unknown[]) =>
    handlers.get(event)?.forEach((cb) => cb(...args));

  return { socket, server };
}
