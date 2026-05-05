# React Hooks & State

## Quick Overview

React Hooks let you use state, side effects, context, and other React features in function components. Beyond the basic `useState`, React provides `useEffect` for side effects, `useContext` for shared state, `useRef` for mutable refs, and `useMemo`/`useCallback` for performance optimization. You can also build **custom hooks** to extract and reuse stateful logic across components.

## Key Concepts

### Rules of Hooks

Two non-negotiable rules — break them and React breaks:

1. **Call hooks at the top level only.** Never inside `if`, `for`, early returns, or nested functions. The hook must be reached on **every** render in **the same order**.
2. **Call hooks only from React components or other custom hooks.** Don't call them from regular utility functions, event handlers, class components, or one-off callbacks.

```tsx
// ❌ Conditional — wrong
function User({ id }: { id: string | null }) {
  if (!id) return null;
  const [user, setUser] = useState<User>();        // hook is skipped on null id render!
}

// ✅ Top-level
function User({ id }: { id: string | null }) {
  const [user, setUser] = useState<User>();
  if (!id) return null;                             // early-return AFTER all hooks
}

// ❌ Inside an event handler — wrong
function Button() {
  const handleClick = () => {
    const [x, setX] = useState(0);                  // hooks can't run on click
  };
}
```

**Why these rules?** React tracks hooks **by call order**, not by name — `useState`, `useEffect`, `useState`, etc. If you skip one conditionally, the second `useState` returns the first one's slot on the next render. Subtle, devastating bugs.

> **Install `eslint-plugin-react-hooks`** — it's in the default Vite + React + TS template. The two rules:
> - `react-hooks/rules-of-hooks` — flags conditional / non-component hook calls.
> - `react-hooks/exhaustive-deps` — flags missing dependencies in `useEffect`/`useMemo`/`useCallback`.
>
> Trust the linter. If it warns, the warning is almost always right.

### useEffect

`useEffect` runs side effects after render. It replaces the lifecycle methods of class components (`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`).

**Three dependency patterns:**

```tsx
// 1. No dependency array — runs after EVERY render
useEffect(() => {
  console.log('Runs on every render');
});

// 2. Empty array — runs ONCE after initial render
useEffect(() => {
  console.log('Runs once on mount');
}, []);

// 3. With dependencies — runs when any dependency changes
useEffect(() => {
  console.log(`userId changed to ${userId}`);
}, [userId]);
```

**Cleanup function** — returned function runs before the effect re-runs and on unmount:

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => console.log(e.key);
  window.addEventListener('keydown', handler);

  return () => {
    window.removeEventListener('keydown', handler); // cleanup
  };
}, []);
```

**Common patterns:**

```tsx
// Fetch data — `cancelled` flag (legacy approach, easy to read)
useEffect(() => {
  let cancelled = false;

  async function fetchUser() {
    const res = await fetch(`/api/users/${id}`);
    const data = await res.json();
    if (!cancelled) setUser(data);
  }

  fetchUser();
  return () => { cancelled = true; }; // prevent state update on unmounted component
}, [id]);

// Fetch data — AbortController (modern, cancels the request itself)
useEffect(() => {
  const controller = new AbortController();

  async function fetchUser() {
    try {
      const res = await fetch(`/api/users/${id}`, { signal: controller.signal });
      const data = await res.json();
      setUser(data);
    } catch (err) {
      // AbortError fires when controller.abort() runs — silently ignore it
      if ((err as Error).name !== 'AbortError') throw err;
    }
  }

  fetchUser();
  return () => controller.abort();   // cancels the in-flight HTTP request
}, [id]);

// Timer
useEffect(() => {
  const interval = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(interval);
}, []);

// Document title
useEffect(() => {
  document.title = `${unreadCount} new messages`;
}, [unreadCount]);
```

> **`cancelled` flag vs `AbortController`** — the flag only stops the React state update; the HTTP request still runs and downloads its body. `AbortController` cancels the request itself — the browser tears down the connection. Prefer `AbortController` for any non-trivial request. Lesson 09 (Data Fetching) shows how this scales to TanStack Query.

**Gotcha: object/array as a dependency** — every render creates a new object/array reference, so the dep is *always* "different" to React's `Object.is` comparison, and the effect fires every render → infinite loop. The bug shows up in two flavors:

```tsx
// ❌ Inline literal — obvious (but rare in real code)
useEffect(() => {
  fetchRooms({ status: 'open' });
}, [{ status: 'open' }]);

// ❌ Object from props/state — the realistic version
function RoomList({ filter }: { filter: { status: string } }) {
  useEffect(() => {
    fetchRooms(filter);
  }, [filter]);
  // If the parent renders and passes a fresh `filter` object every time,
  // this fires every parent render. Network spam → backend cries.
}
```

Three fixes:

```tsx
// ✅ Depend on the primitive fields you actually read
useEffect(() => {
  fetchRooms({ status: filter.status });
}, [filter.status]);

// ✅ Build the object inside the effect, depend on nothing (or just primitives)
useEffect(() => {
  fetchRooms({ status: 'open' });
}, []);

// ✅ When the object MUST be a stable reference, useMemo it in the parent
const filter = useMemo(() => ({ status }), [status]);
```

`useMemo`/`useCallback` are the escape hatch for genuinely necessary object/function deps — covered later in this lesson.

### useContext & createContext

Context provides a way to pass data through the component tree without prop drilling.

**Steps:**
1. Create context with `createContext`
2. Wrap a subtree with `<Context.Provider value={...}>`
3. Consume with `useContext(Context)` in any descendant

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
  user: string | null;
  login: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  const value: AuthContextType = {
    user,
    login: (name) => setUser(name),
    logout: () => setUser(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for clean consumption
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

**When to use context:** global state shared by many components (theme, auth, locale). Not a replacement for all prop passing — if only a few components need the data, props are fine.

**When Context isn't enough — Zustand**

Context has two real downsides at scale:
1. **Every consumer re-renders** when *any* part of the value changes. A context with `{ user, theme, sidebarOpen }` re-renders all subscribers when `sidebarOpen` flips, even if they only read `user`.
2. **No selectors out of the box** — you can't subscribe to "just `user.email`".

For app-wide stores with many slices, **Zustand** is the lightweight modern answer (~1 KB, no providers, supports selectors):

```tsx
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  async login(email, password) {
    const res = await fetch('/api/auth/login', { /* ... */ });
    const { accessToken, user } = await res.json();
    localStorage.setItem('token', accessToken);
    set({ token: accessToken, user });
  },
  logout() {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));

// Subscribe to only what this component reads — no re-render on unrelated state changes
function UserBadge() {
  const userName = useAuthStore((s) => s.user?.name);
  return <span>{userName ?? 'Guest'}</span>;
}
```

For this course we use **Context + custom hook** as the default (it's the pattern you'll see in 80% of codebases) and reach for Zustand when the re-render cost or boilerplate becomes painful. If you've heard of Redux Toolkit / Jotai / Recoil — same family, different trade-offs.

### Custom Hooks

Custom hooks extract reusable stateful logic. Rules:
- Name must start with `use`
- Can call other hooks inside
- Each component using the hook gets its own state (no shared state between callers)

```tsx
// useLocalStorage — persist state to localStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// Usage
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

```tsx
// useDebounce — debounce a rapidly changing value
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// Usage — only fires API call after user stops typing for 300ms
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  if (debouncedSearch) fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

### useRef

`useRef` holds a mutable value that persists across renders **without causing re-renders** when changed.

**Two main uses:**

```tsx
// 1. DOM references
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => inputRef.current?.focus();

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}

// 2. Mutable value that survives re-renders (like an instance variable)
function Timer() {
  const intervalRef = useRef<number | null>(null);

  const start = () => {
    if (intervalRef.current !== null) return;          // already running
    intervalRef.current = window.setInterval(() => console.log('tick'), 1000);
  };

  const stop = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;                       // reset so start() works again
    }
  };

  return (
    <>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}
```

**useRef vs useState:** `useRef` does not trigger re-renders. Use it for values you need to track but that should not affect the UI (previous values, timer IDs, DOM nodes).

### useMemo and useCallback

Both are **performance optimizations** that memoize values/functions to avoid expensive recalculations or unnecessary re-renders.

```tsx
// useMemo — memoize a computed value
const sortedItems = useMemo(
  () => items.slice().sort((a, b) => a.name.localeCompare(b.name)),
  [items] // only recompute when items changes
);

// useCallback — memoize a function reference
const handleClick = useCallback(
  (id: string) => setSelected(id),
  [] // stable reference, never changes
);
```

**When to use:**
- `useMemo` — expensive calculations, derived data from large lists
- `useCallback` — passing callbacks to memoized child components

**When NOT to use:**
- Simple calculations (adding numbers, string concatenation) — the memoization overhead is greater than the calculation itself
- Functions that are not passed to child components
- Premature optimization — profile first, optimize second

> **How to verify memoization actually helps**: open React DevTools → Profiler tab → record an interaction → check whether the component re-rendered fewer times after your `useMemo`/`useCallback` change. If the render count is identical, you wrapped the wrong thing. Profiler walkthrough is in Lesson 10.

### React.memo

`React.memo` is a higher-order component that skips re-rendering if props haven't changed (shallow comparison):

```tsx
interface ItemProps {
  name: string;
  onClick: (name: string) => void;
}

const Item = React.memo(function Item({ name, onClick }: ItemProps) {
  console.log(`Rendering ${name}`);
  return <li onClick={() => onClick(name)}>{name}</li>;
});

// Parent must use useCallback for onClick, otherwise Item re-renders every time
// because a new function reference is created on each parent render
```

`React.memo` + `useCallback` work together: `memo` prevents re-render if props are equal, `useCallback` ensures function props keep the same reference.

## Learn More

- [useEffect](https://react.dev/reference/react/useEffect)
- [useContext](https://react.dev/reference/react/useContext)
- [useRef](https://react.dev/reference/react/useRef)
- [useMemo](https://react.dev/reference/react/useMemo)
- [useCallback](https://react.dev/reference/react/useCallback)
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React.memo](https://react.dev/reference/react/memo)

## How to Work

1. **Study examples**:
   - `examples/use-effect-patterns.tsx` — data fetching, event listener cleanup, timer, dependency patterns
   - `examples/context-example.tsx` — ThemeContext with provider, consumer hook, nested components
   - `examples/custom-hooks.tsx` — useLocalStorage, useDebounce, useWindowSize

2. **Complete exercises**:
   - `exercises/use-fetch.tsx` — build a custom `useFetch<T>(url)` hook
   - `exercises/theme-switcher.tsx` — build a ThemeContext with provider, hook, and themed components

3. **Complete the App Task** below.

## App Task

In `santa-app`, layer the global state (auth, api access) on top of what you already built in Lessons 03-04.

### 1. Create `AuthContext`

Create `src/contexts/AuthContext.tsx`:

```tsx
interface User {
  id: string;
  email: string;
  displayName: string;     // matches santa-api/docs/api-contract.md
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;       // true while we're restoring the session on mount
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

**Login flow — the contract is two requests:**
1. `POST /api/auth/login` body `{ email, password }` → `{ accessToken }` (no user data!)
2. `GET /api/users/me` with `Authorization: Bearer <accessToken>` → `{ id, email, displayName }`

So inside `login(email, password)`:
- POST credentials, store the returned `accessToken` in `localStorage` and React state.
- Immediately call `GET /api/users/me` with the new token to fetch the current user.
- Store the user in state.
- If either step fails: clear partial state, re-throw so the form can show the error.

```tsx
async function login(email: string, password: string) {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) throw new Error('Invalid credentials');
  const { accessToken } = (await loginRes.json()) as { accessToken: string };

  const meRes = await fetch(`${baseUrl}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) throw new Error('Failed to load profile');
  const user = (await meRes.json()) as User;

  localStorage.setItem('token', accessToken);
  setToken(accessToken);
  setUser(user);
}
```

**Session restore on mount:**
- Read `token` from `localStorage`. If present, call `GET /api/users/me`. On success → set `user`. On 401 → clear the token (it's expired).
- Use `isLoading` while this runs so `<ProtectedRoute>` (Lesson 06) doesn't bounce the user to `/login` during the round-trip.
- Wrap `<App />` with `<AuthProvider>` in `main.tsx`.

> **Backend contract reminder** (matches `santa-api/docs/api-contract.md`):
> - `POST /api/auth/register` body `{ email, password, displayName }` → `{ id, email, displayName, accessToken }`
> - `POST /api/auth/login` body `{ email, password }` → `{ accessToken }`
> - `GET /api/users/me` (auth required) → `{ id, email, displayName }`
>
> Lesson 09 (Data Fetching) replaces all this manual `fetch` with a typed API service + TanStack Query. For now, plain `fetch` is fine.

**Verify §1:**
- [ ] `<App />` is wrapped in `<AuthProvider>` (check `main.tsx`).
- [ ] On first mount with no token in `localStorage`: `isLoading` flips `true → false`, `user` and `token` stay `null`.
- [ ] On first mount with a valid token in `localStorage`: `isLoading` flips `true → false`, `user` is populated from `/api/users/me`.
- [ ] On first mount with an expired/invalid token: the failed `/me` call clears `localStorage.token` and the state.
- [ ] `isAuthenticated` is `true` exactly when `user !== null` (or `token !== null` — pick one definition and stick to it).
- [ ] `logout()` clears `user`, `token`, and `localStorage.token` synchronously.

### 2. Create `useAuth` custom hook

```tsx
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

This is the consumption pattern: never call `useContext(AuthContext)` directly elsewhere. The thrown error catches the "I forgot the provider" mistake at the first render.

### 3. Create `useApi` for authenticated requests

Create `src/hooks/useApi.ts` — a thin wrapper that auto-attaches the JWT and handles 401s globally:

```tsx
export function useApi() {
  const { token, logout } = useAuth();

  const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (res.status === 401) {
      logout();                                 // token expired or rejected
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  return {
    get:  <T>(url: string)               => request<T>(url),
    post: <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  };
}
```

> **Disclaimer**: this is the manual baseline. Lesson 09 replaces `useApi` with a typed module + **TanStack Query** that adds caching, dedup, refetch-on-focus, mutations with cache invalidation, and devtools. The patterns translate — `useApi` is fine for the next 4 lessons.
>
> Two practical notes:
> - `request` is recreated on every render (closure over `token`). Don't put it in a `useEffect` deps array as-is — wrap with `useCallback` or use it directly inside event handlers and one-shot async flows. (Lesson 09's TanStack Query solves this entirely.)
> - `useApi` calls `useAuth()` — by the Rules of Hooks, both `useApi` and any component calling it must be inside `<AuthProvider>`.

### 4. Wire up the existing `LoginForm` to `auth.login`

> You already built `LoginForm` with controlled inputs + validation in **Lesson 03 (styling) + Lesson 04 (React mechanics)**. This task is just the wiring — no UI rewrite.

In your existing `LoginPage` (or `LoginForm`):
1. Get `auth` via `const auth = useAuth();`.
2. Replace the L04 `console.log(formData)` placeholder in the submit handler with:
   ```tsx
   try {
     setSubmitting(true);
     setSubmitError(null);
     await auth.login(email, password);
     // success — Lesson 06 wires the navigate('/rooms') here
   } catch (err) {
     setSubmitError(err instanceof Error ? err.message : 'Login failed');
   } finally {
     setSubmitting(false);
   }
   ```
3. While `submitting` is true: disable the submit button, show a spinner / "Signing in…" text.
4. If `submitError` is set: render an error banner above the form.
5. On success: a temporary `console.log('logged in', auth.user?.email)` is fine — Lesson 06 introduces routing and `navigate('/rooms')`.

**Verify §4:**
- [ ] Wrong credentials → `submitError` shows "Invalid credentials" (or whatever the API returned). Submit button re-enables.
- [ ] Correct credentials → button briefly shows the loading state, then `auth.user` is populated. React DevTools confirms `user` and `token` are set in the AuthContext.
- [ ] Refresh the page after login → `<AuthProvider>` restores the session from `localStorage`, `auth.user` is repopulated automatically.
- [ ] Click logout (add a temporary button in your layout) → `auth.user`, `auth.token` are `null`, `localStorage.token` is gone.
