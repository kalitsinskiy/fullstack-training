# React Router

## Quick Overview

Single-page apps need **client-side routing** to navigate without full page reloads. **React Router v7** is the de-facto standard — used in 80%+ of React projects. This lesson covers routes, navigation, params, nested layouts, and protected routes — and ends with a brief tour of **TanStack Router**, the typed-routing alternative you'll meet in some modern codebases.

> Lesson 07 (UI Components) covers Material UI and Tailwind+shadcn separately. This lesson is about routing only.

## Quick Recommendation

| You're working on… | Pick |
|---|---|
| New project, standard CRUD app | **React Router v7** |
| Existing codebase with React Router v6 | Stay on v6 — v7 migration is mostly cosmetic |
| Type-safety obsession, full-stack DX | **TanStack Router** |

## Key Concepts

### Client-Side Routing

Traditional websites reload the entire page on navigation. SPAs use the **History API** (`history.pushState`, `popstate` event) to update the URL and render different components — no server round-trip. React Router abstracts this away.

```
Browser URL changes → React Router matches a Route → Renders the component
```

### React Router v7 Setup

```bash
npm install react-router
```

> Heads-up: in v7 the package is `react-router` (not `react-router-dom`). v6 codebases that import from `react-router-dom` still work; the v7 release made it the default name. Use `react-router` for new projects.

Core API:

```tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Navigation Hooks

```tsx
import { useNavigate, useParams, useSearchParams } from 'react-router';

// useParams — read URL parameters
// TS thinks `id` is `string`, but at runtime it's `string | undefined`.
// Always handle the missing case (see callout below).
function UserDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <NotFound />;
  return <h1>User {id}</h1>;
}

// useNavigate — programmatic navigation
function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async () => {
    await login();
    navigate('/dashboard');                          // push new route
    navigate('/dashboard', { replace: true });       // replace current history entry
    navigate(-1);                                    // go back
  };
}

// useSearchParams — read/write query string
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  return (
    <input
      value={query}
      onChange={(e) => setSearchParams({ q: e.target.value })}
    />
  );
}
```

> **Typing `useParams` is a lie** — TS lets you say `useParams<{ id: string }>()` but at runtime `id` could still be `undefined` if the route doesn't match. Always handle the missing case (`if (!id) return <NotFound />;`) or use TanStack Router for real type safety.

### NavLink — Active Styling

`NavLink` knows whether it matches the current URL — perfect for navigation menus:

```tsx
import { NavLink } from 'react-router';

<NavLink
  to="/rooms"
  className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}
>
  Rooms
</NavLink>
```

### Nested Routes & Layouts

Use `<Outlet />` to render child routes inside a parent layout — the layout stays mounted across navigations:

```tsx
import { Outlet } from 'react-router';

function Layout() {
  return (
    <div>
      <header>My App</header>
      <main>
        <Outlet />          {/* child route renders here */}
      </main>
      <footer>Footer</footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>          {/* layout route — no path */}
          <Route index element={<Home />} />  {/* index route: "/" */}
          <Route path="about" element={<About />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Protected Routes

The pattern: a guard component that checks auth and either renders the children or redirects.

```tsx
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // While checking auth (e.g. restoring from localStorage on first load), don't bounce
  if (isLoading) return <div>Loading…</div>;

  if (!isAuthenticated) {
    // `replace` — don't keep the protected URL in browser history
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

Wire it into the route tree:

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  <Route element={<ProtectedRoute />}>     {/* guard */}
    <Route element={<Layout />}>            {/* layout, only for authed users */}
      <Route index element={<Navigate to="/rooms" replace />} />
      <Route path="rooms" element={<RoomsPage />} />
      <Route path="rooms/:id" element={<RoomDetailPage />} />
    </Route>
  </Route>

  <Route path="*" element={<NotFound />} />
</Routes>
```

> **Why a separate guard route**: nesting `<ProtectedRoute>` outside `<Layout>` means the layout (header, sidebar, etc.) doesn't even render for unauthenticated users. If you flip the order, you get a flash of layout chrome around the redirect — bad UX.

### Redirect after login — preserving the destination

When a user hits `/rooms/abc` while logged out, you want to send them to `/login` *and* return them to `/rooms/abc` after they sign in. Capture the original location in `state`:

```tsx
// ProtectedRoute.tsx
import { useLocation, Navigate, Outlet } from 'react-router';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

// LoginPage.tsx
import { useLocation, useNavigate } from 'react-router';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // location.state is unknown — narrow it via a guard, don't `as`-cast blindly
  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? '/rooms';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(email, password);
    navigate(from, { replace: true });
  };
  // ... rest of the form (controlled inputs from L04)
}
```

### Loaders and Actions (v6.4+ data API)

React Router has a "data API" with `loader` and `action` functions that run **before** the component renders — you can fetch data in the route definition itself:

```tsx
const router = createBrowserRouter([
  {
    path: '/rooms/:id',
    loader: async ({ params }) => {
      const res = await fetch(`/api/rooms/${params.id}`);
      if (!res.ok) throw new Response('Not Found', { status: 404 });
      return res.json();
    },
    element: <RoomDetailPage />,
    errorElement: <ErrorPage />,
  },
]);

// Inside the component:
function RoomDetailPage() {
  const room = useLoaderData() as Room;
  return <h1>{room.name}</h1>;
}
```

This avoids the loading flicker of `useEffect`-based fetching and pairs nicely with `defer` + `<Suspense>`.

In this course we keep the **`<Routes>`-based** approach (simpler, more common) and use **TanStack Query** (Lesson 09) for data fetching. If you join a project that uses the data API, the concepts transfer — both are about co-locating data with routes.

## A Brief Tour of TanStack Router

Worth knowing about even though you'll mostly meet React Router. The pitch: **fully typed URLs, params, search params, and loader data** with zero runtime overhead.

```bash
npm install @tanstack/react-router
```

Define routes as a tree of typed objects. TS knows every path, every param, every search-param shape:

```tsx
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { z } from 'zod';

const rootRoute = createRootRoute({ component: Layout });

const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms',
  // Search params validated by Zod — type inferred for consumers
  validateSearch: z.object({ page: z.number().default(1), q: z.string().optional() }),
  component: RoomsPage,
});

const roomDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms/$id',                 // $id, not :id
  loader: ({ params }) => api.get(`/rooms/${params.id}`),
  component: RoomDetailPage,
});

const router = createRouter({
  routeTree: rootRoute.addChildren([roomsRoute, roomDetailRoute]),
});

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
```

Inside a component, params are typed:

```tsx
import { useParams, useSearch } from '@tanstack/react-router';

function RoomsPage() {
  const { page, q } = useSearch({ from: '/rooms' });   // typed: number, string | undefined
  // ...
}

function RoomDetailPage() {
  const { id } = useParams({ from: '/rooms/$id' });    // typed: string
  // ...
}
```

**Trade-offs**:
- ✅ Real type-safety — refactor a route, the compiler tells you what to fix
- ✅ Search-param validation built in (Zod / Valibot)
- ✅ Built-in caching for loader data
- ❌ Smaller community — fewer Stack Overflow answers
- ❌ More setup — route definitions verbose
- ❌ Most companies still standardize on React Router

We won't use TanStack Router in `santa-app` — but if you encounter it in a code interview, this brief is enough to recognize the patterns.

## Learn More

- [React Router Docs](https://reactrouter.com/)
- [Migrating from v6 to v7](https://reactrouter.com/upgrading/v7)
- [TanStack Router](https://tanstack.com/router/latest)
- [React Router data API (loaders/actions)](https://reactrouter.com/start/framework/data-loading)

## How to Work

1. **Study examples**:
   - `examples/basic-routing.tsx` — BrowserRouter, Routes, Route, Link, useParams, 404 page
   - `examples/protected-routes.tsx` — ProtectedRoute component, layout with Outlet, redirect-after-login

2. **Complete exercises**:
   - `exercises/multi-page-app.tsx` — multi-page app with React Router
   - `exercises/protected-app.tsx` — protected routes with auth guard

3. **Complete the App Task** below.

## App Task

In `santa-app`, layer routing on top of the AuthContext you built in Lesson 05.

### 1. Install React Router

```bash
cd santa-app
npm install react-router
```

> If your project already has `react-router-dom` from a starter, keep it — both packages are interchangeable in v7. The examples and exercises in this lesson import from `react-router` (the new default).

**Verify §1:**
- [ ] `npm run dev` boots without errors.
- [ ] `import { BrowserRouter } from 'react-router'` resolves with no IDE warning.

### 2. Wire the route tree (use `<BrowserRouter>` + `<Routes>`)

> **Which API**: this course uses the **`<BrowserRouter>` + `<Routes>`** pattern (the `<Routes>`-based API). The data API (`createBrowserRouter` + loaders) is shown earlier for awareness — you'll meet it in some codebases — but **TanStack Query** in Lesson 09 takes over the data-fetching role, so we don't use loaders here.

```
/login              → LoginPage           (public)
/register           → RegisterPage        (public)
/rooms              → RoomsPage           (protected — list)
/rooms/:id          → RoomDetailPage      (protected — detail)
/rooms/:id/wishlist → WishlistPage        (protected — items in this room)
*                   → NotFoundPage
```

In `src/App.tsx`:

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route element={<ProtectedRoute />}>            {/* §3 */}
      <Route element={<Layout />}>                  {/* §4 */}
        <Route index element={<Navigate to="/rooms" replace />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:id" element={<RoomDetailPage />} />
        <Route path="/rooms/:id/wishlist" element={<WishlistPage />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

The page components (`RoomsPage`, `RoomDetailPage`, `WishlistPage`, `NotFoundPage`) can be empty `<h1>Rooms</h1>` placeholders for now — Lessons 08 and 09 fill them in.

**Verify §2:**
- [ ] Navigating to `/rooms`, `/rooms/abc`, `/rooms/abc/wishlist` directly in the URL bar (while logged in) renders the right placeholder.
- [ ] Navigating to a random URL like `/foobar` renders `NotFoundPage`.
- [ ] Hitting `/` redirects to `/rooms` (when logged in) or to `/login` (when logged out — proven in §3).

### 3. Create `ProtectedRoute` + redirect-after-login

This step combines the **guard** (block unauthenticated users) and the **destination preservation** (return them where they were trying to go). It's one component plus one `LoginPage` change — keep them together.

`src/components/ProtectedRoute.tsx`:

```tsx
import { useLocation, Navigate, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading…</div>;        // session restore from L05 still in flight

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
```

Update your existing `LoginPage` (the one you wired to `auth.login()` in Lesson 05) — read the saved destination and navigate there on success:

```tsx
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where the user was heading before being bounced — fall back to /rooms
  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? '/rooms';

  // If already logged in (e.g. they clicked /login by mistake), bounce to destination
  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await auth.login(email, password);              // real API call from Lesson 05
      navigate(from, { replace: true });              // success — go where they wanted
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Login failed');
    }
  };
  // ... rest of the form (already built in L03 + L04 + L05)
}
```

**Verify §3:**
- [ ] Logged out, type `/rooms/abc` in the URL bar → bounce to `/login`.
- [ ] Log in successfully → land back on `/rooms/abc` (not `/rooms` or `/`).
- [ ] Logged in, click "Login" link by mistake → bounce away from `/login` to `/rooms` (or last `from`).
- [ ] Hard-refresh on `/rooms` while logged in: `<ProtectedRoute>` shows `Loading…` briefly (`isLoading` from session restore), then `<RoomsPage>` renders. **No flash to `/login`.**
- [ ] Browser back button after login does NOT take you back to `/login` — that's what `replace: true` enforces.

### 4. Create `Layout`

`src/components/Layout.tsx` — the wrapper rendered around every protected page:

```tsx
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <>
      <header>
        <Link to="/rooms">Secret Santa</Link>
        <nav>
          <NavLink to="/rooms">Rooms</NavLink>
        </nav>
        <span>{auth.user?.displayName}</span>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main>
        <Outlet />                                    {/* protected page renders here */}
      </main>
    </>
  );
}
```

> **Where does styling come in?** You already chose your styling approach in **Lesson 03** (CSS Modules or Tailwind) and built basic styling for forms + RoomCard there. Apply the same approach to the `Layout` header here — no new decisions needed. **Lesson 07** (UI Components) layers a higher-level component library (MUI or shadcn) on top — that's a separate, optional decision about *which primitives you import* (Button, Card, Dialog), not about *how CSS is organized*.

**Verify §4:**
- [ ] Header shows the logged-in user's `displayName` (from L05's AuthContext).
- [ ] Click "Logout" → state clears, you land on `/login`. Hitting back button does NOT bring you to a protected page.
- [ ] `<NavLink to="/rooms">` is styled differently when on `/rooms` (active state) vs other paths.
- [ ] Switching between `/rooms` and `/rooms/abc` does NOT remount the header (Layout stays mounted because it's a parent route — verify in React DevTools by adding a `console.log('Layout render')` and confirming it doesn't fire on every nav).

### 5. (Verify-overall) End-to-end navigation flow

Walk through the whole flow once and confirm:
- [ ] Open the app in a fresh tab → bounced to `/login`.
- [ ] Try an invalid login → error shows, no nav happens.
- [ ] Valid login → land on `/rooms`, header shows your name.
- [ ] Click a `RoomCard` (or simulate `/rooms/abc`) → URL updates, layout stays, only main content swaps.
- [ ] Direct URL `/rooms/abc/wishlist` → renders the wishlist placeholder under the same layout.
- [ ] Logout → back to `/login`, browser back button doesn't restore the protected page.
