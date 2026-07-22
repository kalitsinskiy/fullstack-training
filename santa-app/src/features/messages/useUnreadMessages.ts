import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';

const QUERY_KEY = ['messages', 'unread'];
const KEY_STR = JSON.stringify(QUERY_KEY);
const EMPTY: Record<string, number> = {};

export function useUnreadMessages(): {
  counts: Record<string, number>;
  increment: (roomId: string) => void;
  clear: (roomId: string) => void;
  total: number;
} {
  const queryClient = useQueryClient();

  // Use the QueryCache as the external store so that setQueryData mutations
  // trigger synchronous re-renders that act() can flush in tests.
  const counts = useSyncExternalStore(
    useCallback(
      (onChange) =>
        queryClient.getQueryCache().subscribe((event) => {
          if (JSON.stringify(event.query.queryKey) === KEY_STR) {
            onChange();
          }
        }),
      [queryClient],
    ),
    () => queryClient.getQueryData<Record<string, number>>(QUERY_KEY) ?? EMPTY,
    () => EMPTY,
  );

  const increment = useCallback(
    (roomId: string) => {
      queryClient.setQueryData<Record<string, number>>(
        QUERY_KEY,
        (prev = {}) => ({ ...prev, [roomId]: (prev[roomId] ?? 0) + 1 }),
      );
    },
    [queryClient],
  );

  const clear = useCallback(
    (roomId: string) => {
      queryClient.setQueryData<Record<string, number>>(
        QUERY_KEY,
        (prev = {}) => {
          const next = { ...prev };
          delete next[roomId];
          return next;
        },
      );
    },
    [queryClient],
  );

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return { counts, increment, clear, total };
}
