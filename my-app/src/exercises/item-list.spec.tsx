// ============================================
// Exercise: ItemList Tests (MSW + TanStack Query, matches L09)
// ============================================
//
// You're testing an ItemList that:
//   - Reads via `useQuery({ queryKey: ['items'], queryFn: GET /api/items })`
//   - Deletes via `useMutation` (DELETE /api/items/:id) with cache invalidation
//   - Renders loading / empty / error / list states
//
// HTTP is mocked at the network boundary with MSW. You override per-test
// using `server.use(...)`.
//
// In santa-app, `setupServer(...)` lives in src/test/msw-server.ts, and
// listen/reset/close are wired in src/test/setup.ts (see lesson README §"Setup").
// This file inlines them for a runnable single-file demo only.
//
// Tests to implement (replace each TODO with a real test body):
// 1. Loading state visible while the request is pending
// 2. Renders all items from the GET response
// 3. Empty state when GET returns []
// 4. Error message when GET fails (500)
// 5. Retry button refetches after error
// 6. Delete: clicking a row's Delete fires DELETE with the right id and
//    the row disappears from the rendered list
//
// Hints:
// - Wrap the component in a fresh QueryClient per test (provided helper).
// - Default handlers are below; override them with `server.use(...)` inside
//   a test for failure / different responses.
// - Use `await screen.findByText(...)` for async appearance.
// - Use `screen.queryByText(...)` for absence assertions.
// - To track which DELETE id was hit: capture it inside the handler.

/* eslint-disable */
// @ts-nocheck — exercise stub. Remove this directive after implementing.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// ---- Types ----

interface Item {
  id: string;
  name: string;
  description: string;
}

const BASE_URL = 'http://localhost:3001';

// ---- Component Under Test (do NOT modify) ----

async function getItems({ signal }: { signal: AbortSignal }): Promise<Item[]> {
  const res = await fetch(`${BASE_URL}/api/items`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function ItemList() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['items'],
    queryFn: ({ signal }) => getItems({ signal }),
  });

  const remove = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError) {
    return (
      <div>
        <p role="alert">{(error as Error).message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }
  if (!data?.length) return <p>No items yet.</p>;

  return (
    <ul>
      {data.map((it) => (
        <li key={it.id}>
          <span>{it.name}</span>
          <span> — </span>
          <span>{it.description}</span>
          <button
            onClick={() => remove.mutate(it.id)}
            disabled={remove.isPending && remove.variables === it.id}
          >
            {remove.isPending && remove.variables === it.id ? 'Deleting…' : 'Delete'}
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---- Test helpers (do NOT modify) ----

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const sampleItems: Item[] = [
  { id: '1', name: 'Warm socks', description: 'Wool, size M' },
  { id: '2', name: 'Coffee mug', description: 'Ceramic, 350ml' },
  { id: '3', name: 'Book', description: 'Clean Code' },
];

// ---- MSW — default handlers ----

const server = setupServer(
  http.get(`${BASE_URL}/api/items`, () => HttpResponse.json(sampleItems)),
  http.delete(`${BASE_URL}/api/items/:id`, () => new HttpResponse(null, { status: 204 }))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---- Tests — implement each TODO ----

describe('ItemList', () => {
  // Test 1: Loading state
  // Override GET with a never-resolving handler so the component stays in
  // the isLoading branch; assert synchronously — no await needed.
  test('shows loading state on mount', () => {
    server.use(
      http.get(`${BASE_URL}/api/items`, async () => {
        await new Promise(() => {}); // intentionally never resolves
      })
    );
    renderWithQuery(<ItemList />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  // Test 2: Renders items from default handler
  // Default server handler returns sampleItems; wait for the first name,
  // then assert all three are present and the spinner is gone.
  test('renders items after successful fetch', async () => {
    renderWithQuery(<ItemList />);
    await screen.findByText('Warm socks');
    expect(screen.getByText('Coffee mug')).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });

  // Test 3: Empty state
  // Override GET to return an empty array; component renders "No items yet."
  test('shows empty state when no items', async () => {
    server.use(http.get(`${BASE_URL}/api/items`, () => HttpResponse.json([])));
    renderWithQuery(<ItemList />);
    await screen.findByText('No items yet.');
  });

  // Test 4: Error state
  // Override GET to return HTTP 500; component shows an alert paragraph with
  // the error message and a Retry button.
  test('shows error message on fetch failure', async () => {
    server.use(http.get(`${BASE_URL}/api/items`, () => new HttpResponse(null, { status: 500 })));
    renderWithQuery(<ItemList />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('HTTP 500');
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  // Test 5: Retry recovers from error
  // First call returns 500; second call (triggered by Retry) returns sampleItems.
  // After clicking Retry the list should appear and the alert should be gone.
  test('retry button refetches items after error', async () => {
    let callCount = 0;
    server.use(
      http.get(`${BASE_URL}/api/items`, () => {
        callCount++;
        if (callCount === 1) return new HttpResponse(null, { status: 500 });
        return HttpResponse.json(sampleItems);
      })
    );
    renderWithQuery(<ItemList />);
    await screen.findByRole('alert');
    await userEvent.click(screen.getByText('Retry'));
    await screen.findByText('Warm socks');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // Test 6: Delete
  // Capture the id from the DELETE handler; click the first Delete button;
  // assert the captured id equals '1' (the id of "Warm socks").
  test('clicking Delete sends DELETE with the correct id', async () => {
    let deletedId: string | null = null;
    server.use(
      http.delete(`${BASE_URL}/api/items/:id`, ({ params }) => {
        deletedId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      })
    );
    renderWithQuery(<ItemList />);
    await screen.findByText('Warm socks');
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await userEvent.click(deleteButtons[0]); // first row is id '1'
    expect(deletedId).toBe('1');
  });
});
