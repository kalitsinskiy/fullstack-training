import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useUnreadMessages } from './useUnreadMessages';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

describe('useUnreadMessages', () => {
  it('starts with zero total and empty counts', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadMessages(), { wrapper });
    expect(result.current.total).toBe(0);
    expect(result.current.counts).toEqual({});
  });

  it('increment increases count for the given roomId', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadMessages(), { wrapper });

    act(() => result.current.increment('room-1'));
    expect(result.current.counts['room-1']).toBe(1);
    expect(result.current.total).toBe(1);

    act(() => result.current.increment('room-1'));
    expect(result.current.counts['room-1']).toBe(2);
    expect(result.current.total).toBe(2);
  });

  it('increment tracks multiple rooms independently', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadMessages(), { wrapper });

    act(() => {
      result.current.increment('room-1');
      result.current.increment('room-2');
      result.current.increment('room-2');
    });

    expect(result.current.counts['room-1']).toBe(1);
    expect(result.current.counts['room-2']).toBe(2);
    expect(result.current.total).toBe(3);
  });

  it('clear removes the count for a room', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadMessages(), { wrapper });

    act(() => {
      result.current.increment('room-1');
      result.current.increment('room-2');
    });
    expect(result.current.total).toBe(2);

    act(() => result.current.clear('room-1'));
    expect(result.current.counts['room-1']).toBeUndefined();
    expect(result.current.counts['room-2']).toBe(1);
    expect(result.current.total).toBe(1);
  });

  it('clear on a room with no unread is a no-op', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadMessages(), { wrapper });

    act(() => result.current.clear('room-unknown'));
    expect(result.current.total).toBe(0);
  });

  it('two hook instances sharing the same QueryClient see the same state', () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result: a } = renderHook(() => useUnreadMessages(), { wrapper });
    const { result: b } = renderHook(() => useUnreadMessages(), {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    });

    act(() => a.current.increment('room-1'));
    expect(b.current.counts['room-1']).toBe(1);
  });
});
