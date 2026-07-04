# Testing santa-app — the approach

Component tests with **Vitest + React Testing Library + MSW**. We render a page
or component inside the real app providers and interact with it the way a user
would (query by role/label, type, click), then assert what the user sees.
Network calls are intercepted by **MSW**, so tests never hit a real backend.

## What's provided

```
src/test/
  setup.ts          # jest-dom matchers + MSW lifecycle (listen/reset/close)
  render.tsx        # renderWithProviders(ui, { route }) — Query + Auth + Router
  mocks/handlers.ts # MSW request handlers (add one per endpoint a test calls)
  mocks/server.ts   # the MSW server
```

Frontend tests are **co-located** next to the component (`LoginPage.test.tsx`
beside `LoginPage.tsx`) — the React convention. (The backend keeps its tests in
a separate `test/` folder, which is the Nest/Node convention — different
ecosystems, different norms.) `LoginPage.test.tsx` ships with one worked example
plus an `it.todo` list; build the rest the same way.

## How to write one

```tsx
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, screen } from '@/test/render';

it('logs in and navigates to /rooms', async () => {
  server.use(
    http.post('/api/auth/login', () => HttpResponse.json({ accessToken: 't' })),
    http.get('/api/users/me', () => HttpResponse.json({ id: '1', email: 'a@b.c', displayName: 'A' })),
  );
  renderWithProviders(<LoginPage />);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.c');
  await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  // assert navigation / side effect…
});
```

In tests `VITE_API_URL` is unset, so axios uses **relative** URLs — match them
with a leading slash in handlers (`/api/...`).

## What to test

- **Pages** — render with `renderWithProviders`; assert the key UI is present,
  then drive the happy path and the error path (MSW success vs 4xx).
  Start with Login (done), then Register, RoomList, RoomDetail, Profile.
- **Data fetching** — components using `useQuery`: loading state → data rendered;
  mock the endpoint with MSW and assert the list/empty state.
- **Hooks** — `useAuth`: login stores the token and exposes the user; logout clears it.
- **Guards/routing** — `AuthGuard` redirects an unauthenticated user to /login.

## Run

```bash
npm test           # vitest run
npm run test:watch # watch mode
```
