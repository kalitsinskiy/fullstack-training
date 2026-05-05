# Testing React

## Quick Overview

A test that survives a refactor is worth more than a hundred coverage points. **React Testing Library (RTL)** is built on one principle: *test what the user sees and does, not how it's wired up*. **Vitest** is the runner — same API as Jest, faster, native to Vite. **MSW (Mock Service Worker)** intercepts HTTP requests so your tests run against realistic endpoint behavior without a live server.

This lesson covers the four shapes of frontend test you'll write: **component**, **hook**, **form** (with RHF + Zod from Lesson 08), and **integration with mocked API** (TanStack Query from Lesson 09 + Router from Lesson 06).

## Quick Recommendation

| Test concern | Tool |
|---|---|
| Test runner, watch mode | **Vitest** |
| Component / interaction tests | **React Testing Library** |
| User events | `@testing-library/user-event` |
| HTTP mocking | **MSW** |
| Custom hooks | RTL's `renderHook` |
| Snapshots | Sparingly, only for stable presentational components |

Jest is still alive in older codebases — the API is mostly identical. If you're handed a Jest project, everything in this lesson translates.

## Testing Philosophy

RTL is **opinionated** about good tests:

- ✅ Find elements by **role**, **label**, or **visible text** — what a user (or a screen reader) sees.
- ✅ Simulate real user interactions: typing, clicking, focusing, tabbing.
- ✅ Assert on the rendered output: a heading, an error message, a redirect.
- ❌ Don't reach into component internals: state, refs, instance methods, render counts.
- ❌ Don't test third-party libraries (RHF, Zod, Query) directly. Test your code that uses them.

Refactor a `LoginForm` from a class to hooks, swap `useState` for RHF — if the test still passes, your test is good. If it breaks, your test was coupled to implementation.

## Setup with Vite + Vitest

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

`vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw-server';      // see "MSW setup" below

// MSW: start before tests, reset between, close after
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test":         "vitest",
    "test:run":     "vitest run",
    "test:cov":     "vitest run --coverage",
    "test:ui":      "vitest --ui"
  }
}
```

Run: `npm test` (watch mode), `npm run test:run` (one-shot, for CI).

## Component testing — the four-line pattern

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  test('fires onClick when activated', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Save</Button>);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

Every test follows the same shape:
1. Render the component
2. Find an element by what the user sees
3. Interact (or just assert)
4. Expect the visible result

### Query priority

```
getByRole              ← preferred — accessibility-first
getByLabelText         ← form inputs
getByPlaceholderText
getByText              ← visible text
getByDisplayValue      ← input current value
getByAltText           ← images
getByTitle
getByTestId            ← last resort, `data-testid`
```

Each comes in three forms:
- `getBy…` — throws if not found (synchronous)
- `queryBy…` — returns `null` if not found (use to assert absence)
- `findBy…` — returns a promise; waits for the element (use for async)

```tsx
expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
expect(screen.queryByText('Error')).not.toBeInTheDocument();
const heading = await screen.findByRole('heading', { name: 'Dashboard' });
```

### `userEvent` over `fireEvent`

`fireEvent` dispatches a single DOM event. `userEvent` simulates the full sequence (pointerdown → focus → mousedown → mouseup → click). Always start with `userEvent.setup()` and `await` every interaction.

## Testing forms (RHF + Zod from Lesson 08)

Don't test that RHF wires up `onChange`. Test the **user-visible behavior**: validation errors appear, the submit handler is called with the right data, server errors render in an alert.

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';   // RHF + Zod from Lesson 08

describe('LoginForm', () => {
  test('shows validation errors when submitting empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/password/i), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'alice@test.com',
        password: 'SecretPass1',
      });
    });
  });

  test('shows server error from a rejected onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/password/i), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i);
  });
});
```

## Testing hooks — `renderHook`

For hooks that don't need a provider (e.g. `useCounter`):

```tsx
import { renderHook, act } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  test('increments', () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => { result.current.increment(); });
    expect(result.current.count).toBe(1);
  });
});
```

For hooks that need context (e.g. `useAuth` from Lesson 05), pass a `wrapper`:

```tsx
import { AuthProvider } from '../contexts/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const { result } = renderHook(() => useAuth(), { wrapper });
```

## Mocking the API — MSW (preferred) vs direct mocks

### MSW — intercept the network at the boundary

```ts
// src/test/msw-server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('http://localhost:3001/api/rooms', () => {
    return HttpResponse.json([
      { id: '1', name: 'Office Party', memberCount: 8 },
      { id: '2', name: 'Family Exchange', memberCount: 5 },
    ]);
  }),

  http.post('http://localhost:3001/api/auth/login', async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    if (email === 'wrong@test.com') return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    return HttpResponse.json({ accessToken: 'fake-token' });
  }),
);
```

In a test, override per-scenario:

```tsx
test('shows error when API rejects login', async () => {
  server.use(
    http.post('http://localhost:3001/api/auth/login', () =>
      HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })),
  );

  // Now render, type, click — your real fetch hits the mock.
});
```

**Why MSW**:
- Tests exercise the real `fetch` + service layer + components together
- Mocks live at the **HTTP boundary**, where the contract actually is
- Same handlers work in dev (browser-side worker) and in tests (Node-side server)
- Refactoring the API service layer doesn't break tests — only changing endpoints does

### Direct mocking — when MSW is overkill

For a unit test of a single hook that calls `api.get`, mocking the module is shorter:

```ts
import { api } from '../services/api';

vi.mock('../services/api');
const mockedApi = vi.mocked(api);

test('useRooms loads rooms', async () => {
  mockedApi.get.mockResolvedValue([{ id: '1', name: 'X' }]);
  // ...
});
```

Use direct mocking when you're testing a single layer in isolation. Use MSW when you're testing what the user actually sees.

## Testing routes — `MemoryRouter`

Use `MemoryRouter` instead of `BrowserRouter` in tests. `BrowserRouter` works in jsdom (jsdom has `window.history`), but it's painful to isolate between tests — the URL stays whatever the previous test left it as, leaking state. `MemoryRouter` takes `initialEntries` and starts with a clean in-memory history every render, so each test is independent:

```tsx
import { MemoryRouter, Routes, Route } from 'react-router';
import { render, screen } from '@testing-library/react';

test('protected route redirects when unauthenticated', () => {
  render(
    <MemoryRouter initialEntries={['/rooms']}>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/rooms" element={<div>Rooms screen</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText('Login screen')).toBeInTheDocument();
});
```

If you adopted TanStack Router instead, follow [its testing guide](https://tanstack.com/router/latest/docs/framework/react/guide/testing) — the principles are identical (assert on what the user sees after a navigation), but the test wrapper API is different.

## Testing components that use TanStack Query

Wrap the component in a fresh `QueryClient` per test so caches don't leak:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },         // don't retry in tests — fail fast
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

test('shows fetched rooms', async () => {
  // MSW already returns the rooms via the global handlers
  renderWithQuery(<RoomList />);
  expect(await screen.findByText('Office Party')).toBeInTheDocument();
});
```

`retry: false` is the single most useful setting — without it, a failing test waits 5+ seconds for retries before reporting.

## Reusable test utilities

`renderWithQuery` (above) is the minimum: just QueryClient. Most tests in santa-app need more — the rendered component reads `useNavigate`, `useParams`, `useAuth`. Build a single `renderApp(ui)` helper that wires every provider your components need (router + auth context + query client + your styling stack), then use it everywhere. `renderWithQuery` is the fallback for **isolated component tests** that genuinely don't touch the router or auth (rare).

```tsx
// src/test/renderApp.tsx — adapt providers to what your app actually uses.
// Drop ones you don't have; the goal is "one wrapper mirroring main.tsx".
export function renderApp(ui: React.ReactElement, { route = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* If you chose MUI in L07: wrap with <ThemeProvider theme={muiTheme}>.    */}
        {/* If you chose Tailwind + shadcn: no provider needed (CSS classes do it). */}
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
```

Now any test is `renderApp(<RoomsPage />, { route: '/rooms' })`.

## Async testing — `waitFor` vs `findBy`

```tsx
// findBy — wait for a single element to appear (preferred when checking presence)
const heading = await screen.findByRole('heading', { name: 'Dashboard' });

// waitFor — wait for an arbitrary assertion to pass
await waitFor(() => {
  expect(onSubmit).toHaveBeenCalled();
});

// waitForElementToBeRemoved — explicit wait for disappearance
await waitForElementToBeRemoved(() => screen.queryByText('Loading…'));
```

Don't `setTimeout` or sleep in tests — always use the library's async helpers.

## Snapshot tests — use sparingly

```tsx
test('Button matches snapshot', () => {
  const { container } = render(<Button variant="primary">Click me</Button>);
  expect(container.firstChild).toMatchSnapshot();
});
```

Only good for stable, presentational components (icons, badges, simple buttons). Bad for anything that renders dynamic data — every test failure becomes a "did this change matter?" review chore. Prefer specific assertions.

## CI integration

For a deploy pipeline:

```yaml
# .github/workflows/test.yml — sketch
- run: npm ci
- run: npm run test:cov          # uses the script you added in §1
- uses: codecov/codecov-action@v4   # optional coverage reporting
```

> Note: `npm run test:run --coverage` does NOT work — npm swallows the flag instead of passing it to vitest. Either use the dedicated `test:cov` script (preferred) or write `npm run test:run -- --coverage` (the `--` tells npm to forward).

Vitest's `--reporter=junit` gives you a JUnit XML for CI dashboards.

## Learn More

- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Query Priority Guide](https://testing-library.com/docs/queries/about#priority)
- [MSW — Getting Started](https://mswjs.io/docs/getting-started)
- [Testing TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
- [Common Mistakes with RTL](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## How to Work

1. **Study examples**:
   - `examples/component-test.spec.tsx` — Button render + click + disabled
   - `examples/form-test.spec.tsx` — RHF + Zod form: validation, submit, server error
   - `examples/hook-test.spec.tsx` — `renderHook` with and without a provider
   - `examples/api-mock-test.spec.tsx` — component + MSW + TanStack Query end-to-end

2. **Complete exercises**:
   - `exercises/login-form.spec.tsx` — write tests for LoginForm
   - `exercises/item-list.spec.tsx` — write tests for an ItemList that fetches data

3. **Complete the App Task** below.

## App Task

In `santa-app`, set up the test stack and write the regression tests that protect every flow you've built across Lessons 04-10.

### 1. Setup

```bash
cd santa-app
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

Wire up `vite.config.ts`, `src/test/setup.ts`, `src/test/msw-server.ts`, and the npm scripts as shown in this lesson.

**Verify §1:**
- [ ] `npm test -- --run` exits 0 with "no tests" (until you write some).
- [ ] In a smoke test (`echo "import { describe, test, expect } from 'vitest'; describe('s', () => test('t', () => expect(1).toBe(1)))" > src/test/smoke.spec.ts`) — passes.
- [ ] `expect(...).toBeInTheDocument()` resolves with no IDE warning (jest-dom matchers extended in `setup.ts`).

### 2. Build a `renderApp` helper

Wrap router + auth context + query client + (optionally) your theme provider. Every test in santa-app should use it.

**Verify §2:**
- [ ] `import { renderApp } from '@/test/renderApp'` resolves.
- [ ] A throwaway test that does `renderApp(<App />)` mounts without error.
- [ ] `renderApp(<RoomsPage />, { route: '/rooms' })` lands `useLocation().pathname` on `/rooms` (you can assert this from inside a test component).

### 3. MSW handlers — full L09 contract

You need **every** endpoint your app talks to, otherwise `onUnhandledRequest: 'error'` from `setup.ts` aborts the test. Here's the complete list (matches `santa-api/docs/api-contract.md`):

```
# Auth
POST /api/auth/login     → 200 { accessToken: 'fake-token' }
                         → 401 if email === 'wrong@test.com'
POST /api/auth/register  → 201 { id, email, displayName, accessToken }
                         → 409 if email === 'taken@test.com'
GET  /api/users/me       → 200 { id, email, displayName }
                         → 401 if no Authorization header

# Rooms
GET  /api/rooms          → array of 2 rooms
GET  /api/rooms/:id      → matching room or 404
POST /api/rooms          → 201 echo body with a generated id
POST /api/rooms/:id/join → 200 { message: 'joined' }
                         → 400 if inviteCode !== 'VALID'

# Wishlist & assignment (after L09 §5)
GET  /api/rooms/:id/wishlist           → 200 { items: [...] }   (your own wishlist)
PUT  /api/rooms/:id/wishlist           → 200 echo body          (save your wishlist)
GET  /api/rooms/:id/assignment         → 404 (no draw yet) or 200 { assignedToUserId, ... }
GET  /api/rooms/:id/assignment/wishlist → 404 or 200 { items: [...] }
```

> Use a closure `let` to flip the assignment endpoints between "no draw yet" (404) and "draw happened" (200) inside individual tests with `server.use(...)` — that's how you exercise the L09 §5 "Awaiting draw" placeholder behavior.

**Verify §3:**
- [ ] All handlers above are registered in `src/test/msw-server.ts` (or wherever you put `setupServer`).
- [ ] A trivial test that mounts `<App />` with a logged-in user produces **zero** "MSW: warning — captured a request without a matching handler" — `onUnhandledRequest: 'error'` from `setup.ts` would fail the test on a missing handler.
- [ ] Per-test override pattern works: `server.use(http.get(..., () => HttpResponse.json([], { status: 200 })))` flips the response only for that test.

### 4. Write the tests

| Test file | What it covers |
|---|---|
| `LoginForm.spec.tsx` | renders fields; **Zod** validation errors; calls `auth.login` on submit; shows server error on 401 (via `setError('root.serverError')`) |
| `RegisterForm.spec.tsx` | confirm-password mismatch (Zod `.refine`); success path; 409 server error rendered |
| `ProtectedRoute.spec.tsx` | redirects to `/login` when unauth; renders children when auth |
| `RoomsPage.spec.tsx` | loading; rendered list (via TanStack Query + MSW handlers); empty state; error state |
| `RoomDetailPage.spec.tsx` | fetches by id; renders members; "Join" button fires `POST /api/rooms/:id/join` mutation; cache invalidation refreshes the list |
| `useAuth.spec.tsx` | starts unauth; `login` stores token + calls `GET /api/users/me` to populate user; `logout` clears token AND `queryClient.clear()` |
| `WishlistEditor.spec.tsx` | add / remove / edit items (RHF `useFieldArray`); submit fires `PUT /api/rooms/:id/wishlist`; per-row Zod validation |

**Verify §4:**
- [ ] All tests run from `npm test -- --run` and pass.
- [ ] Each test uses **`renderApp(...)`** — no test wires its own provider tree.
- [ ] Form tests assert on **visible text** (Zod messages, error banners), never on `errors.email?.message` directly.
- [ ] Query tests use MSW overrides, never `vi.mock('../services/api')` — the service layer + cache + component all run together.
- [ ] No `setTimeout` or `await new Promise(r => setTimeout(r, …))` anywhere — only `findBy*` / `waitFor` / `waitForElementToBeRemoved`.

### 5. Coverage target

Vitest configures coverage in `vite.config.ts`, NOT in `package.json` (that's Jest's syntax):

```ts
// vite.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.spec.{ts,tsx}', 'src/main.tsx', 'src/test/**'],
      thresholds: { lines: 70, branches: 70, functions: 70, statements: 70 },
    },
  },
});
```

Run with `npm run test:cov` (the script you added in §1).

70% is realistic and catches real regressions. Don't chase 100% — coverage of feature-flag conditionals and one-line wrappers isn't worth the maintenance.

**Verify §5:**
- [ ] `npm run test:cov` produces a coverage report; `./coverage/index.html` opens an HTML breakdown.
- [ ] Below threshold → command exits non-zero. Try lowering one number, deleting a covering test, and re-running — the failure must be visible.
- [ ] Files in `exclude` (e.g. `main.tsx`) don't affect the coverage percentage.

### 6. Sabotage check

After all tests pass, deliberately break each of these and verify a test fails:

- Set `accessToken` → `access_token` in `auth.login` response handling — **at least one auth test must fail** (e.g. login no longer stores the token, follow-up `GET /api/users/me` 401s).
- Remove the `<Navigate>` from `ProtectedRoute` — **the protected-route test must fail** (unauth visit lands on the protected screen instead of `/login`).
- Remove the Zod validation error display in `LoginForm` — **the form test must fail** ("Enter a valid email" no longer appears on empty submit).
- Change `['rooms']` → `['Rooms']` in `RoomsPage` — **the rooms-list test must fail** (cache slot mismatched, MSW handler still fires but Query never reads it back).
- Drop `queryClient.clear()` from `auth.logout` — **the privacy test must fail** (after logout + re-login as a different user, an old query result is briefly visible).

If a sabotage doesn't break any test, that's a missing test. Add it.

**Verify §6:**
- [ ] Each of the five sabotages above is exercised; each one breaks at least one test.
- [ ] Restore the source after each sabotage — your final test suite must be green against the **correct** code.

### What you have now

A santa-app where:
- Every lesson's contribution has a regression test
- The test runner is fast (Vitest), modern (MSW), and matches what users actually see (RTL queries)
- Refactoring is safe — tests pass even when implementation changes shape
- CI rejects PRs that break the auth or rooms flows

This is the end of the frontend section. Next block (06-fullstack) wires `santa-app` to `santa-api` end-to-end and adds production deployment, observability, and the realtime / WebSocket layer.
