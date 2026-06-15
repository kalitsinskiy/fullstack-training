/**
 * TanStack Query — read endpoints
 *
 * Same RoomList as `manual-data-fetching.tsx`, but with `useQuery`.
 * Compare line counts and behavior:
 *   - Cached across components automatically
 *   - Refetches on window focus, network reconnect
 *   - Cancellation via the `signal` argument
 *   - Stale data shows immediately on revisit (no loading flicker)
 *
 * To run:
 *   npm install @tanstack/react-query
 *   Wrap your app in <QueryClientProvider client={...}>.
 *   Import <QueryDataFetchingApp /> in App.tsx.
 */

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

// ---- Types ----

interface Room {
  id: string;
  name: string;
  code: string;
  memberCount: number;
}

// ---- Fake API (same as manual example for fair comparison) ----

async function fetchRooms({ signal }: { signal?: AbortSignal } = {}): Promise<Room[]> {
  await new Promise((resolve, reject) => {
    const t = setTimeout(resolve, 800);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

  if (Math.random() < 0.2) throw new Error('Failed to fetch rooms. Server returned 500.');

  return [
    { id: '1', name: 'Office Party', code: 'ABC123', memberCount: 8 },
    { id: '2', name: 'Family Exchange', code: 'DEF456', memberCount: 5 },
    { id: '3', name: 'Friends Xmas', code: 'GHI789', memberCount: 12 },
  ];
}

// ---- The whole component ----

function RoomList() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['rooms'],
    queryFn: ({ signal }) => fetchRooms({ signal }),
    staleTime: 30_000,                  // fresh for 30s — no refetch in that window
  });

  if (isLoading) return <div style={{ padding: 20 }}>Loading…</div>;

  if (isError) {
    return (
      <div style={{ padding: 20, background: '#fdecea', borderRadius: 8 }}>
        <strong>Error:</strong> {(error as Error).message}
        <div style={{ marginTop: 8 }}>
          <button onClick={() => refetch()}>Try again</button>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return <div style={{ padding: 20, color: '#888' }}>No rooms yet.</div>;
  }

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Rooms ({data.length})</h2>
        <button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {data.map((r) => (
          <article key={r.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: 'white' }}>
            <h3 style={{ marginTop: 0 }}>{r.name}</h3>
            <p style={{ margin: '4px 0', color: '#666' }}>Code: {r.code}</p>
            <p style={{ margin: '4px 0', color: '#666' }}>{r.memberCount} members</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---- Demo wrapper ----

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
});

export default function QueryDataFetchingApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '0 auto' }}>
        <h1>useQuery example</h1>
        <p style={{ color: '#666' }}>
          Open this in two tabs — both share the cache via the same QueryClient instance per browser.
          Switch away from the tab and back: see the auto-refetch on focus.
        </p>
        <RoomList />
        {/* Render twice to demonstrate dedup — only one network request fires */}
        <hr style={{ margin: '24px 0' }} />
        <p style={{ color: '#666' }}>Same component again — note: no second network request.</p>
        <RoomList />
      </div>
    </QueryClientProvider>
  );
}
