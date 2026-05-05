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
  http.delete(`${BASE_URL}/api/items/:id`, () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---- Tests — implement each TODO ----

describe('ItemList', () => {
  // TODO 1: Loading state
  // - Override the GET handler to return a never-resolving promise
  //   (Hint: `await new Promise(() => {})` inside the handler delays forever)
  // - Render and assert "Loading…" is visible
  test('shows loading state on mount', () => {
    // TODO: Implement
  });

  // TODO 2: Renders items from default handler
  // - Render — default handler returns sampleItems
  // - Wait for at least one item name to appear
  // - Assert all 3 names are present, "Loading…" is gone
  test('renders items after successful fetch', async () => {
    // TODO: Implement
  });

  // TODO 3: Empty state
  // - server.use a GET that returns []
  // - Render
  // - Wait for "No items yet." to appear
  test('shows empty state when no items', async () => {
    // TODO: Implement
  });

  // TODO 4: Error state
  // - server.use a GET that returns 500
  // - Render
  // - Wait for the alert; assert message contains "HTTP 500"
  // - Assert "Retry" button is present
  test('shows error message on fetch failure', async () => {
    // TODO: Implement
  });

  // TODO 5: Retry recovers from error
  // - First GET → 500, second → sampleItems (track call count or use `.use(...)` chain)
  // - Render, wait for alert, click Retry
  // - Wait for items to appear, assert alert is gone
  test('retry button refetches items after error', async () => {
    // TODO: Implement
  });

  // TODO 6: Delete
  // - Capture which id the DELETE handler received (closure variable)
  // - Render, wait for items
  // - Click the first Delete button
  // - Assert handler captured id === '1'
  // - Assert the row with "Warm socks" is gone (after invalidation refetch returns
  //   the remaining 2 items — override GET on retest, OR keep it simple by asserting
  //   the DELETE was sent with the right id)
  test('clicking Delete sends DELETE with the correct id', async () => {
    // TODO: Implement
  });
});
