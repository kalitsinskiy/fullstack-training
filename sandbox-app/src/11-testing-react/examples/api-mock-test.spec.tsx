// ============================================
// API Mock Test Example — MSW + TanStack Query (matches L09)
// ============================================
// Tests a RoomList that fetches via TanStack Query — the L09 stack.
// HTTP is intercepted at the boundary by MSW so the real `fetch` +
// service layer + Query cache run end-to-end.
//
// What we test:
//   - loading state visible during the fetch
//   - the rendered list after fetch resolves
//   - empty state
//   - error state + retry behavior (server.use override per-test)
//
// Why MSW over `vi.mock`:
//   - tests survive an api-service refactor
//   - same handlers can run in dev (browser worker) and tests (node server)
//   - the contract — URL / method / status / body — is explicit
//
// In santa-app, you'd put `setupServer(...)` in src/test/msw-server.ts and
// listen/reset/close in src/test/setup.ts (see README §"Setup with Vite + Vitest").
// This file inlines those for a runnable single-file demo.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// ---- Types ----

interface Room {
  id: string;
  name: string;
  memberCount: number;
}

// ---- Component Under Test (matches the L09 santa-app shape) ----

const BASE_URL = 'http://localhost:3001';

async function fetchRooms({ signal }: { signal: AbortSignal }): Promise<Room[]> {
  const res = await fetch(`${BASE_URL}/api/rooms`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function RoomList() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rooms'],
    queryFn: ({ signal }) => fetchRooms({ signal }),
  });

  if (isLoading) return <p>Loading rooms…</p>;
  if (isError) {
    return (
      <div>
        <p role="alert">{(error as Error).message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }
  if (!data?.length) return <p>No rooms yet. Create one!</p>;

  return (
    <ul>
      {data.map((r) => (
        <li key={r.id}>
          {r.name} ({r.memberCount} members)
        </li>
      ))}
    </ul>
  );
}

// ---- Test render helper — fresh QueryClient per test, retries off ----

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// ---- MSW server — default handlers (overridden per test as needed) ----

const server = setupServer(
  http.get(`${BASE_URL}/api/rooms`, () =>
    HttpResponse.json([
      { id: '1', name: 'Office Party', memberCount: 8 },
      { id: '2', name: 'Family Exchange', memberCount: 5 },
    ]),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---- Tests ----

describe('RoomList (TanStack Query + MSW)', () => {
  test('shows loading state initially', () => {
    renderWithQuery(<RoomList />);
    expect(screen.getByText(/loading rooms/i)).toBeInTheDocument();
  });

  test('renders rooms after the fetch resolves', async () => {
    renderWithQuery(<RoomList />);

    expect(await screen.findByText(/office party/i)).toBeInTheDocument();
    expect(screen.getByText(/family exchange/i)).toBeInTheDocument();
    // Loading copy is gone
    expect(screen.queryByText(/loading rooms/i)).not.toBeInTheDocument();
  });

  test('shows empty state when the server returns []', async () => {
    server.use(http.get(`${BASE_URL}/api/rooms`, () => HttpResponse.json([])));

    renderWithQuery(<RoomList />);

    expect(await screen.findByText(/no rooms yet/i)).toBeInTheDocument();
  });

  test('shows an error message on a failed fetch', async () => {
    server.use(
      http.get(`${BASE_URL}/api/rooms`, () =>
        HttpResponse.json({ message: 'Boom' }, { status: 500 }),
      ),
    );

    renderWithQuery(<RoomList />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/http 500/i);
  });

  test('Retry button refetches and recovers', async () => {
    const user = userEvent.setup();

    // Fail once, then succeed
    let callCount = 0;
    server.use(
      http.get(`${BASE_URL}/api/rooms`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ message: 'Boom' }, { status: 500 });
        }
        return HttpResponse.json([{ id: '1', name: 'Recovered', memberCount: 1 }]);
      }),
    );

    renderWithQuery(<RoomList />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText(/recovered/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(callCount).toBe(2);
  });
});
