# Data Fetching: from `fetch` to TanStack Query

## Quick Overview

Every real frontend talks to a backend. The naive approach — `fetch` inside `useEffect`, with `useState` for loading/error/data — works for one screen. By screen 3 you'll be reimplementing **caching**, **deduplication**, **stale-while-revalidate**, **refetch on focus**, **optimistic updates**, **request cancellation**. That's what **TanStack Query** ships out of the box.

This lesson teaches both:
1. The **manual** approach — so you understand what's actually happening on the wire.
2. **TanStack Query** — so you stop writing the same boilerplate every screen.

> Lesson 08 (Forms) handles **submitting** data; this lesson is about **reading** data and writing **mutations** that the cache can react to.

## Quick Recommendation

| You're doing… | Use |
|---|---|
| One-shot fetch on mount, single component | manual `fetch` is fine |
| List + detail pages, polling, refetch on actions | **TanStack Query** |
| Fire-and-forget POST (e.g. login) | `fetch` directly is fine |
| Mutations that should update cached lists/details | **TanStack Query `useMutation`** + cache invalidation |

## Part 1 — fetch foundations

### `fetch` reality check

The browser's `fetch` rejects only on **network failure**. A `404` or `500` response is still a *resolved* promise. Always check `response.ok`:

```ts
const res = await fetch('/api/users');

if (!res.ok) {
  throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}
const data = await res.json();
```

Use `AbortController` to cancel the actual HTTP request (not just discard the response):

```ts
const controller = new AbortController();
const res = await fetch('/api/users', { signal: controller.signal });
// somewhere else: controller.abort();
```

### A typed API service layer

A single module that knows the base URL, attaches the JWT, normalizes errors. **Use this even if you adopt TanStack Query later** — Query handles caching and async state; you still need *something* that knows how to make a request.

```ts
// src/services/api.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? 'Request failed', body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Each method accepts an optional `options` so callers can pass `signal`
// (and any other RequestInit fields). useFetch and TanStack Query's
// queryFn both rely on this for cancellation.
export const api = {
  get:    <T>(url: string, options?: RequestInit) =>
    request<T>(url, options),
  post:   <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'POST',   body: body && JSON.stringify(body) }),
  patch:  <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'PATCH',  body: body && JSON.stringify(body) }),
  put:    <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'PUT',    body: body && JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
```

> **Backend contract reminder** (matches `santa-api/docs/api-contract.md`):
> - `POST /api/auth/login` → `{ accessToken: string }` *(camelCase, not `access_token`)*
> - `POST /api/auth/register` → `{ id, email, displayName, accessToken }`
> - `POST /api/rooms/:id/join` → body `{ inviteCode }`. The `:id` is the room's MongoDB id, `inviteCode` is the human-readable join code.

### The manual hook — `useState + useEffect + fetch`

```tsx
interface AsyncState<T> { data: T | null; loading: boolean; error: string | null }

function useFetch<T>(endpoint: string) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    api.get<T>(endpoint, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return;
        setState({ data: null, loading: false, error: (err as Error).message });
      });

    return () => controller.abort();
  }, [endpoint]);

  return state;
}
```

### Where this falls apart

Build a real app and you'll meet all of these within a week:

| Problem | What goes wrong |
|---|---|
| Two components mount that call the same endpoint | Two HTTP requests, double the load on the server |
| User navigates away and comes back | Refetches everything, blank screen flicker |
| User submits a form that should refresh a list | You manually pass a `refetch` prop down the tree |
| Tab is in the background for 10 minutes | Data is stale, no refetch on focus |
| Optimistic update for "delete" | Manual rollback on failure becomes painful |
| Pagination with cursor | Cache fragmentation, infinite-scroll bugs |
| Race condition: user types fast | Old responses overwrite new ones (without manual `cancelled` flag) |

This is what **TanStack Query** gives you for free.

## Part 2 — TanStack Query

### Setup

```bash
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,                 // data is "fresh" for 30s — no refetch
      gcTime: 5 * 60 * 1000,             // unused queries garbage-collected after 5 min
      retry: 1,                          // retry failed queries once
      refetchOnWindowFocus: true,        // refetch when tab regains focus (default)
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools />               {/* dev-only, doesn't ship to prod */}
  </QueryClientProvider>
);
```

### The simplest read — `useQuery`

```tsx
import { useQuery } from '@tanstack/react-query';

function RoomList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['rooms'],                                          // cache identity
    queryFn: ({ signal }) => api.get<Room[]>('/api/rooms', { signal }), // pass signal so Query can cancel
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;
  return (
    <ul>
      {data!.map((room) => <li key={room.id}>{room.name}</li>)}
    </ul>
  );
}
```

What you got for free vs the manual hook:
- ✅ Same key in two components → one HTTP request, cached result
- ✅ Component unmount + remount → instant render from cache, background refetch
- ✅ Tab focus / network reconnect → automatic refetch
- ✅ Stale data displayed immediately while refetching → no loading flicker on revisits
- ✅ Cancellation: when the component unmounts, the request is aborted via `signal`
- ✅ Devtools panel shows every query, its data, when it last refetched

### Query keys are cache identities

A `queryKey` is whatever uniquely identifies the data:

```ts
['rooms']                                       // list of rooms
['rooms', roomId]                               // one specific room
['rooms', { page: 2, limit: 10 }]               // paginated list
['rooms', roomId, 'wishlist', 'me']             // my own wishlist in a room
['rooms', roomId, 'assignment', 'wishlist']     // my assigned giftee's wishlist
```

Same key → same cache slot. Change a key → new cache slot.

### Mutations — `useMutation`

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateRoomButton() {
  const queryClient = useQueryClient();

  const createRoom = useMutation({
    mutationFn: (name: string) => api.post<Room>('/api/rooms', { name }),
    onSuccess: (newRoom) => {
      // Tell the cache "the rooms list might have changed — refetch"
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  return (
    <button
      onClick={() => createRoom.mutate('Office Party 2025')}
      disabled={createRoom.isPending}
    >
      {createRoom.isPending ? 'Creating…' : 'Create Room'}
    </button>
  );
}
```

`mutate` fires the request. `invalidateQueries` marks any matching cache entry as stale — and if it's currently rendered, Query refetches it. The `RoomList` from the previous example now **automatically updates** when the mutation succeeds. No prop drilling.

### Optimistic updates

Update the UI immediately, roll back if the server rejects:

```tsx
const deleteRoom = useMutation({
  mutationFn: (id: string) => api.delete(`/api/rooms/${id}`),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['rooms'] });
    const previous = queryClient.getQueryData<Room[]>(['rooms']);
    queryClient.setQueryData<Room[]>(['rooms'], (old) => old?.filter((r) => r.id !== id) ?? []);
    return { previous };
  },
  onError: (_err, _id, ctx) => {
    if (ctx?.previous) queryClient.setQueryData(['rooms'], ctx.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  },
});
```

### Pagination, infinite, dependent queries

```tsx
// Server-side pagination
const { data } = useQuery({
  queryKey: ['rooms', { page, limit }],
  queryFn: () => api.get<Paginated<Room>>(`/api/rooms?page=${page}&limit=${limit}`),
  placeholderData: (prev) => prev,    // "keep previous page data while next loads"
});

// Dependent: don't run until we have a roomId
const { data: room } = useQuery({
  queryKey: ['rooms', roomId],
  queryFn: () => api.get<Room>(`/api/rooms/${roomId}`),
  enabled: !!roomId,
});

// Infinite scroll
import { useInfiniteQuery } from '@tanstack/react-query';

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['notifications'],
  queryFn: ({ pageParam }) => api.get<Page>(`/api/notifications?cursor=${pageParam ?? ''}`),
  initialPageParam: '',
  getNextPageParam: (last) => last.nextCursor ?? undefined,
});
```

### When NOT to use Query

- One-shot mutations with no cache to invalidate (e.g. `auth.login` → store token + redirect). Plain `await api.post(...)` is fine.
- Forms (Lesson 08) — RHF + Zod handle the *form* side; the submit handler can call `useMutation` if it should refresh other queries.
- Static data loaded once at startup (config, feature flags) — `useQuery` is overkill but doesn't hurt; many teams use it anyway for the consistent API.

## Side-by-side comparison

```
Manual fetch + useEffect + useState
────────────────────────────────────────────────────
~30 lines of boilerplate per "list endpoint"
Loading / error / data states tracked manually
No cross-component cache — duplicated requests
Refetch on focus / reconnect — write it yourself
Cancellation — write it yourself
Mutation → list refresh — pass refetch prop down

TanStack Query
────────────────────────────────────────────────────
~5 lines per query
Cache + dedup + refetch + cancel — built in
Mutations invalidate queries by key — list refreshes itself
Devtools panel shows every cache entry
~14 KB gzipped runtime cost
```

The runtime cost is real but small; the cognitive cost saved is enormous. For any app beyond "single screen", Query pays back within a week.

## Production concerns (briefly)

These are not specific to data fetching but they show up here first.

### Environment variables in Vite

Vite exposes env variables prefixed with `VITE_`:

```bash
# .env (committed for defaults)
VITE_API_URL=http://localhost:3001

# .env.production (committed, used by `vite build`)
VITE_API_URL=https://api.santa-app.com

# .env.local (NOT committed — your personal overrides)
VITE_API_URL=http://localhost:3001
```

Access in code:
```ts
const apiUrl = import.meta.env.VITE_API_URL;
```

Type it in `src/vite-env.d.ts`:
```ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
```

> **Never put secrets in `VITE_*` variables.** They are inlined into the production bundle and visible to anyone who downloads your JS. Secrets stay on the backend.

### Build & deploy

- `npm run build` → outputs `dist/` (HTML + hashed JS/CSS chunks). Static; deploy anywhere.
- Hosting: **Vercel** / **Netlify** / **Cloudflare Pages** all auto-detect Vite. `npm run build` + `dist/` is the contract.
- For SPAs, configure the host to serve `index.html` for unknown routes (so `/rooms/abc` works on direct refresh) — Vercel's `vercel.json` `rewrites: [{ source: "/(.*)", destination: "/index.html" }]`, Netlify's `_redirects` `/* /index.html 200`.

## Learn More

- [TanStack Query — Overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TanStack Query — Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [TanStack Query — Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [AbortController (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Vite — Env Variables](https://vitejs.dev/guide/env-and-mode.html)

## How to Work

1. **Study examples**:
   - `examples/api-service.ts` — typed API service layer (foundation for both manual and Query)
   - `examples/manual-data-fetching.tsx` — read endpoint with manual hooks (the "before")
   - `examples/query-data-fetching.tsx` — same screen with TanStack Query (the "after")
   - `examples/query-mutations.tsx` — `useMutation` + cache invalidation + optimistic delete

2. **Complete exercises**:
   - `exercises/api-client.ts` — full typed API client
   - `exercises/crud-page.tsx` — CRUD page with TanStack Query (list + create + delete)

3. **Complete the App Task** below.

## App Task

This lesson **retroactively replaces** the manual data fetching from earlier App Tasks.

### 1. Install

```bash
cd santa-app
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

**Verify §1:**
- [ ] `import { useQuery } from '@tanstack/react-query'` resolves with no IDE warning.
- [ ] `npm run dev` boots without errors.

### 2. Create the API service

Create `src/services/api.ts` from the snippet in Part 1. Use `VITE_API_URL` for the base URL. Add a `.env` with `VITE_API_URL=http://localhost:3001`.

**Verify §2:**
- [ ] `import { api, ApiError } from '@/services/api'` resolves.
- [ ] In `vite-env.d.ts` add `interface ImportMetaEnv { readonly VITE_API_URL: string }` so `import.meta.env.VITE_API_URL` is typed.
- [ ] Manually call `api.get('/api/rooms')` in a console / one-off test page → returns the list (or 401 if not logged in).

### 3. Wrap the app in `QueryClientProvider`

In `src/main.tsx`, create a single `QueryClient` and wrap `<App />` with `<QueryClientProvider>`. Render `<ReactQueryDevtools />` next to `<App />` (it's dev-only).

**Verify §3:**
- [ ] App still renders.
- [ ] Bottom-right floating React Query Devtools logo appears in dev (it does not appear in `npm run build` preview).

### 4. Auth — keep it as direct `fetch`/`api.post`

`auth.login` and `auth.register` don't need Query — they're one-shot mutations with no cached data to invalidate. Wire them into your `AuthContext` from Lesson 05 directly with `api.post(...)`.

**Use the correct contract** (matches `santa-api/docs/api-contract.md`):
- `POST /api/auth/register` → response `{ id, email, displayName, accessToken }`
- `POST /api/auth/login` → response `{ accessToken }` *(login does NOT return the user — fetch profile via `GET /api/users/me` after storing the token, same flow as L05)*

**Verify §4:**
- [ ] `auth.login(email, password)` stores the token then calls `api.get('/api/users/me')` to populate the user.
- [ ] Logging in with valid creds → token in localStorage, user in AuthContext, redirect to the protected route.
- [ ] Logging in with wrong password → `ApiError` with `status: 401` thrown — surface via `setError('root.serverError', …)` in your RHF login form.

### 5. Replace `useEffect`-based reads with `useQuery`

Refactor existing reads + add two NEW read components on the room detail page.

| Component | Status | queryKey | endpoint |
|---|---|---|---|
| `RoomsPage` | exists (L06) | `['rooms']` | `GET /api/rooms` |
| `RoomDetailPage` | exists (L06 placeholder) | `['rooms', id]` | `GET /api/rooms/:id` |
| `WishlistEditor` (read part) | exists (L08) — convert its initial load to `useQuery`, keep RHF for editing | `['rooms', id, 'wishlist', 'me']` | `GET /api/rooms/:id/wishlist` |
| `MyAssignment` | **NEW** | `['rooms', id, 'assignment']` | `GET /api/rooms/:id/assignment` |
| `AssigneeWishlist` | **NEW** | `['rooms', id, 'assignment', 'wishlist']` | `GET /api/rooms/:id/assignment/wishlist` |

> **Why not `GET /api/rooms/:id/wishlist/:userId`?** Wishlists are private — only the room admin and your assigned giftee should see yours. Encoding `:userId` in the URL means the server has to authorize "is the caller this user, the admin, or the assignee?" on every request. The cleaner contract is `/assignment/wishlist`: the server resolves *who* you're drawn to from your JWT, so the URL never reveals another user's id. **Your own** wishlist is `PUT /api/rooms/:id/wishlist` (no userId — implicit from the JWT).
>
> `MyAssignment` and `AssigneeWishlist` only render after the draw has happened (Lesson 03 of the fullstack block). Until then, the endpoints return `404` / `409` — render an "Awaiting draw" placeholder for those statuses.

**Verify §5:**
- [ ] Visit `/rooms` → DevTools shows `['rooms']` query, status `success`. Reload → query is `fresh` (no second request within `staleTime`).
- [ ] Open `/rooms/:id` → `['rooms', id]` and `['rooms', id, 'wishlist', 'me']` queries appear in DevTools.
- [ ] No `useState`/`useEffect` for loading/error/data left in any of these components — Query owns it.
- [ ] Switch tab away for 35s and back → `refetchOnWindowFocus` triggers; DevTools shows the query going `fetching` → `fresh`.
- [ ] `MyAssignment` / `AssigneeWishlist` before the draw → `404`/`409` from server, your component renders the "Awaiting draw" placeholder (do **not** treat 404 as a generic error).

### 6. Mutations with cache invalidation

| Action | mutationFn | invalidate |
|---|---|---|
| Create room | `POST /api/rooms` body `{ name }` | `['rooms']` |
| Join room | `POST /api/rooms/:id/join` body `{ inviteCode }` | `['rooms']`, `['rooms', id]` |
| Set my wishlist | `PUT /api/rooms/:id/wishlist` body `{ items }` | `['rooms', id, 'wishlist', 'me']` |
| Trigger draw | `POST /api/rooms/:id/draw` | `['rooms', id]`, `['rooms', id, 'assignment']`, `['rooms', id, 'assignment', 'wishlist']` |

> **Contract reminder**: `POST /api/rooms/:id/join` takes `inviteCode` in the **body**, not the URL. Earlier App Task drafts had `:code` in the URL — the contract is `:id` + body.

**Verify §6:**
- [ ] Create room → the `RoomsPage` list updates **without** a manual refetch call. DevTools: `['rooms']` flips to `fetching` then `success`.
- [ ] Save wishlist → `WishlistEditor` re-reads via `['rooms', id, 'wishlist', 'me']`. The form's `defaultValues` should come from the query data — **not** a stale local copy.
- [ ] Each `useMutation` has both an `onSuccess` (or `onSettled`) **and** an `onError` — never silently swallow the rejection. Hook server errors back into `setError('root.serverError', …)` for forms, or a toast/alert for non-form actions.

### 7. Add at least one optimistic update

Use the **"Remove wishlist item"** button on `WishlistEditor` (built in L08). Wire it through `useMutation` with `onMutate` / `onError` / `onSettled`:

- `mutationFn`: takes the item index (or local id), calls `PUT /api/rooms/:id/wishlist` with the **filtered** items array (the backend stores the whole list per write).
- `onMutate`: cancel `['rooms', id, 'wishlist', 'me']`, snapshot it, optimistically write the filtered list into the cache so the row disappears instantly.
- `onError`: restore the snapshot — the row reappears.
- `onSettled`: invalidate so the cache reconciles with the server.

This is the only mutation in santa-app where the user perceives the latency difference (a wishlist with 10 items + 100ms server roundtrip = perceptibly slow without optimism). For login, register, create room — the latency is hidden by the navigation/redirect, no optimism needed.

**Verify §7:**
- [ ] Click Remove on an item → row disappears **before** the server replies (use DevTools network throttling at "Slow 4G" to see this clearly).
- [ ] Force a server failure (point `mutationFn` at a non-existent endpoint, or use a feature flag in your dev API) → the row **reappears** automatically — `onError` rolled back.
- [ ] After successful remove → final state matches the server (`onSettled` invalidate). No drift between cache and DB after a hard reload.

### 8. End-to-end verify

Open React Query Devtools (the floating logo bottom-right in dev). You should see:
- Query keys for every fetched endpoint, matching the §5 table.
- Their cache state (fresh / stale / inactive).
- Manual refetch / invalidate buttons for testing.

Then walk the golden path:
- [ ] Register → Login → land on `/rooms` (one network call to `GET /api/rooms` — confirm in Network tab and DevTools).
- [ ] Create room → list refreshes (no manual refresh), navigate into the new room.
- [ ] Set wishlist → save → reload → items persist.
- [ ] Logout → query cache cleared (`queryClient.clear()` on logout — add it to your `auth.logout`).

### What you have now

A santa-app where every read is cached and dedup'd, every mutation auto-refreshes the affected lists, and a single auth header is attached to every request from one place. Lesson 10 layers `Suspense` and Error Boundaries on top so the loading and error states are app-wide instead of per-component.
