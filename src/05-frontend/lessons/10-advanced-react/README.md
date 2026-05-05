# Advanced React

## Quick Overview

The features in this lesson are what separate a working React app from a **production-grade** one. None of them are "nice to have" — every real app needs them:

- **Code splitting** with `lazy` + `Suspense` — so users don't download 2 MB of JS to see a login screen
- **Error Boundaries** — so a crash in one widget doesn't show users a blank page
- **`useTransition` / `useDeferredValue`** — so heavy renders don't lock the UI
- **`useId`** — for stable accessible IDs across server/client
- **`useOptimistic`** + **`useFormStatus`** + **`useActionState`** — React 19's primitives for snappy UIs
- **React DevTools** + **Profiler** — for diagnosing why a render took 80 ms

By the end of this lesson, `santa-app` becomes resilient (errors are isolated), fast on slow networks (code splitting), and snappy on slow devices (transitions + optimistic updates).

## Code Splitting — `lazy` + `Suspense`

A bundled SPA ships every component to every visitor. A user on `/login` shouldn't download the code for `/rooms/abc`. Code splitting fixes this.

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';

// These imports become separate chunks — fetched only when the route is visited
const RoomsPage      = lazy(() => import('./pages/RoomsPage'));
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage'));
const SettingsPage   = lazy(() => import('./pages/SettingsPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

In dev with Vite you'll see `[hmr] hot updated` for the chunk that lazy-loads. In `npm run build`, you'll see separate `RoomsPage-x7d2k.js` files in `dist/assets/`.

**Where to split:**
- ✅ Per route — biggest payoff, easy to reason about
- ✅ Heavy modal/dialog content shown rarely (e.g. an editor)
- ✅ Third-party libraries used in one place (`react-markdown`, charting libs)
- ❌ Tiny components (the chunk overhead beats the savings)
- ❌ Components used on every screen (just bundle them)

**Preload on intent** — when a user hovers over a link, kick off the chunk fetch before they actually click:

```tsx
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage'));

<Link
  to={`/rooms/${room.id}`}
  onMouseEnter={() => import('./pages/RoomDetailPage')}     // dynamic import = same chunk
>
  {room.name}
</Link>
```

This is what makes navigation feel instant.

## Error Boundaries — keeping crashes local

An uncaught throw during render typically blanks the entire app. Error Boundaries catch errors **below** them in the tree and render a fallback. (Throws inside event handlers and async callbacks bypass them — see "What they DON'T catch" below.)

> Quirk: Error Boundaries must be class components (still in 2026 — there's no hook equivalent). Use the `react-error-boundary` library so you write a function-component fallback and skip the class boilerplate.

```bash
npm install react-error-boundary
```

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" style={{ padding: 16, background: '#fee2e2', borderRadius: 4 }}>
      <p><strong>Something went wrong.</strong></p>
      <pre style={{ fontSize: 12 }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Layout />
    </ErrorBoundary>
  );
}
```

**Layered boundaries** — wrap each route (or each major widget) so a crash in the wishlist doesn't take down the room page:

```tsx
<Layout>
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <RoomDetails />
  </ErrorBoundary>
  <ErrorBoundary FallbackComponent={WishlistErrorFallback}>
    <Wishlist />
  </ErrorBoundary>
</Layout>
```

**What Error Boundaries DO catch:**
- Render errors (`throw` inside a component body)
- Errors thrown during lifecycle methods of class components
- Errors thrown during the render phase of hooks (e.g. a `useMemo` factory that throws)

**What they DON'T catch (this trips everyone up):**
- **Errors in event handlers** — sync or async. `onClick={() => { throw new Error() }}` and `onClick={async () => { await api.post() }}` both bypass every boundary above them.
- Errors in `setTimeout`, `requestAnimationFrame`, `Promise.then` chains
- Errors in `useEffect` async callbacks
- Errors during SSR (separate API)
- Errors thrown inside the boundary's own fallback (the fallback shows blank — wrap *outside*)

To **promote** an event-handler / async error so the nearest boundary picks it up, use `react-error-boundary`'s `useErrorBoundary().showBoundary(err)` (see `examples/error-boundary.tsx`):

```tsx
const { showBoundary } = useErrorBoundary();

const handleClick = async () => {
  try {
    await api.delete(`/api/rooms/${id}`);
  } catch (err) {
    // `err` is `unknown` in strict TS; normalize before promoting
    showBoundary(err instanceof Error ? err : new Error(String(err)));
  }
};
```

For async errors from TanStack Query (Lesson 09), enable boundary integration:

```tsx
new QueryClient({
  defaultOptions: { queries: { throwOnError: true }, mutations: { throwOnError: true } },
});
```

Now any failed query/mutation propagates to the nearest boundary.

## `useTransition` — keep the UI responsive during big renders

Some state updates trigger expensive renders (filtering 10,000 items, switching tabs that mount a heavy component). React 18's `useTransition` lets you mark a state update as **non-urgent** so the browser can keep responding to clicks and keystrokes:

```tsx
import { useState, useTransition } from 'react';

function SearchableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);                  // urgent — input must respond instantly
    startTransition(() => {
      setFilter(e.target.value);               // non-urgent — filtering can lag
    });
  };

  const filtered = items.filter((item) => item.name.includes(filter));

  return (
    <>
      <input value={query} onChange={onChange} />
      {isPending && <span>Filtering…</span>}
      <ul style={{ opacity: isPending ? 0.6 : 1 }}>
        {filtered.map((it) => <li key={it.id}>{it.name}</li>)}
      </ul>
    </>
  );
}
```

The user types: `query` updates immediately (input feels snappy), `filter` updates "soon" (the list lags but doesn't block). React tells you it's working via `isPending`.

## `useDeferredValue` — same idea, no callback

When you can't wrap the state update in `startTransition` (e.g. it comes from a parent), `useDeferredValue` defers a *value*:

```tsx
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  // Heavy work uses the deferred value; React keeps the UI responsive.
  const results = useMemo(() => expensiveSearch(deferredQuery), [deferredQuery]);

  return (
    <ul style={{ opacity: isStale ? 0.6 : 1 }}>
      {results.map((r) => <li key={r.id}>{r.text}</li>)}
    </ul>
  );
}
```

Use `useTransition` when *you* trigger the update; `useDeferredValue` when the value flows in from above.

## `useId` — accessible IDs that match across renders

Every `<label htmlFor="…">` needs a unique ID. Hard-coding (`id="email"`) breaks if the component renders twice. `useId` gives you a stable, server/client-consistent unique ID:

```tsx
type Props = { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>;

function FormField({ label, error, ...inputProps }: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && <span id={errorId} role="alert">{error}</span>}
    </div>
  );
}
```

Render `<FormField label="Email" />` ten times — each gets a unique ID like `:r0:`, `:r1:`. Note: `aria-describedby` and the error span are both rendered **only when `error` is set** — pointing `aria-describedby` at a missing or empty span makes screen readers read silence at every focus.

> The version above works for non-RHF forms (controlled / uncontrolled). For RHF, you need `forwardRef` so `register('email').ref` can attach to the underlying `<input>` — covered in the next subsection.

### Making `FormField` work with React Hook Form

RHF's `register('email')` returns `{name, onChange, onBlur, ref}` and **must** be spread onto the actual `<input>` (RHF's `ref` reads the input's value uncontrolled). If `FormField` hides the `<input>`, you have to forward the ref + spread the rest:

```tsx
import { forwardRef, useId } from 'react';

type Props = {
  label: string;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>;

export const FormField = forwardRef<HTMLInputElement, Props>(
  function FormField({ label, error, hint, ...inputProps }, ref) {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {hint && !error && <span id={hintId}>{hint}</span>}
        {error && <span id={errorId} role="alert">{error}</span>}
      </div>
    );
  },
);
```

Used with RHF:

```tsx
const { register, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

<FormField label="Email" type="email" error={errors.email?.message} {...register('email')} />
```

The spread order matters: `register('email')` is spread **last** so `name`/`onChange`/`onBlur` from RHF are not overridden by anything in `inputProps`. The `ref` from `register` flows through `forwardRef`.

## React 19 — `useOptimistic`, `useFormStatus`, `useActionState`

These tighten the form-action flow from Lesson 08.

### `useOptimistic` — rendered state ≠ committed state

For a "Like" button or a "mark as read" toggle, the UI should update *now* and reconcile with the server later. With Lesson 09's TanStack Query you got this through `onMutate`. React 19 built it into the framework:

```tsx
import { useOptimistic } from 'react';

// `messages` is the *committed* server state — owned by the parent (or a query).
// The parent must update it after sendMessage resolves, otherwise the optimistic
// message vanishes on success too (because optimistic state lives only inside
// the action's transition and is discarded when the action ends).
function MessageList({ messages, sendMessage }: Props) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (current, newMessage: string) => [...current, { id: 'temp', text: newMessage, sending: true }],
  );

  async function handleSubmit(formData: FormData) {
    const text = formData.get('text') as string;
    addOptimisticMessage(text);   // shows immediately (lives inside the transition)
    await sendMessage(text);      // parent's onSuccess refetches/appends the real message
                                  // → committed `messages` now contains it
                                  // → the action ends, optimistic state is dropped
                                  // → render switches to the new committed state seamlessly
  }

  return (
    <>
      <ul>
        {optimisticMessages.map((m) => (
          <li key={m.id} style={{ opacity: m.sending ? 0.5 : 1 }}>{m.text}</li>
        ))}
      </ul>
      <form action={handleSubmit}>
        <input name="text" />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
```

The mental model: optimistic state is a **temporary overlay** on top of `messages` that exists only while the action's transition runs. The moment the action returns, the overlay is removed — what the user sees afterwards is whatever `messages` is at that moment. So **success path = parent updated `messages`** (the optimistic version vanishes but the real message has already replaced it). **Failure path = parent did nothing** (the optimistic version vanishes and we're back to the original list — that's the "automatic rollback").

### `useFormStatus` — read parent form's pending state

In any descendant of `<form action={...}>`:

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}
```

You don't need to drill `isPending` from `useActionState` down to the button — the hook reads the closest form ancestor.

### `useActionState` — covered in Lesson 08

Recap from Lesson 08: pairs an action function with React's transition system, returning `[state, formAction, isPending]`. Use this when the form maps to a single backend action and you want progressive enhancement. For SPA forms with rich client validation, RHF + Zod stays the default.

## Performance — `memo`, `useMemo`, `useCallback`

Recap from Lesson 05, with the working rules:

```tsx
// Memoize a child so it doesn't re-render when props are referentially equal
const Item = memo(function Item({ name, onClick }: { name: string; onClick: () => void }) {
  return <li onClick={onClick}>{name}</li>;
});

// Memoize an expensive value
const sorted = useMemo(() => items.slice().sort((a, b) => a.name.localeCompare(b.name)), [items]);

// Memoize a callback so memoized children don't see a new function reference each render
const handleClick = useCallback((id: string) => setSelected(id), []);
```

**The honest rules:**
1. Don't reach for these by default. They have overhead (memoization comparisons, closure captures).
2. Only optimize what you've measured to be slow (Profiler — below).
3. `memo` only helps if the parent re-renders *and* its props are referentially stable.
4. `useCallback` is only useful if the function is passed to a `memo`'d child or as a dependency of another hook.
5. `useMemo` for actually-expensive computations (sorting/filtering thousands of items, parsing big JSON) — not `n + m`.

## Virtualization (briefly)

For lists of 1000+ items, even the snappiest React paints slowly because every row is a real DOM node. **Virtualization** renders only the visible rows + a small buffer:

```bash
npm install @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualRoomList({ rooms }: { rooms: Room[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rooms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vi) => (
          <div key={vi.key} style={{ position: 'absolute', top: vi.start, height: vi.size }}>
            <RoomCard room={rooms[vi.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

Add this when you actually have 1000+ rows — not before.

## React DevTools + Profiler

### Install

Browser extension: [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) / [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/) / [Edge](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil).

### Components panel

Inspect the React tree. Click a component to see its props, state, and hooks. The 🛑 (suspended) and ⚛️ (memoized) badges help spot what's happening.

Useful tricks:
- Right-click a node → "Store as global variable" — debug it from the console
- `$r` = currently selected component instance (in any tab)
- The "Highlight updates" setting flashes components on render — find unnecessary re-renders fast

### Profiler tab

Records what rendered, when, and why.

1. Click the record button (●)
2. Interact with the app — click, type, navigate
3. Stop recording. You get a flame chart of every commit.

What you see:
- **Bars** — components that rendered, sized by render duration
- **Hovering a bar** — props before/after, what changed, who rendered (parent change vs state vs hook)
- **Ranked view** — sorted slowest-first

What to look for:
- Components rendering more than necessary (parent state change cascading into a 500-item list)
- Renders > 16 ms (anything that pushes you below 60 fps)
- Repeated renders during a single interaction (often a missing `useMemo` or `memo`)

### When to actually use it

Don't profile a feature you haven't shipped. Profile when:
- A specific interaction feels laggy (typing, scrolling, switching tabs)
- A user reported "it's slow when…"
- Before/after a perf optimization to verify it actually helped

## Learn More

- [`React.lazy`](https://react.dev/reference/react/lazy)
- [`Suspense`](https://react.dev/reference/react/Suspense)
- [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary)
- [`useTransition`](https://react.dev/reference/react/useTransition)
- [`useDeferredValue`](https://react.dev/reference/react/useDeferredValue)
- [`useId`](https://react.dev/reference/react/useId)
- [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [React DevTools — official guide](https://react.dev/learn/react-developer-tools)
- [Profiler API (programmatic)](https://react.dev/reference/react/Profiler)

## How to Work

1. **Study examples**:
   - `examples/error-boundary.tsx` — `react-error-boundary` with retry button
   - `examples/lazy-routes.tsx` — code-split routes with preload-on-hover
   - `examples/transitions.tsx` — `useTransition` filtering 10k items
   - `examples/optimistic.tsx` — `useOptimistic` for a like-button
   - `examples/form-field-with-id.tsx` — `useId` reusable accessible field wrapper

2. **Complete exercises**:
   - `exercises/wrap-route-with-boundary.tsx` — add an error boundary + suspense around a route
   - `exercises/optimistic-toggle.tsx` — implement an optimistic "mark as read" toggle

3. **Complete the App Task** below.

## App Task

In `santa-app`:

### 1. Code-split the routes

Convert every protected page to `lazy()`:

```tsx
const RoomsPage      = lazy(() => import('./pages/RoomsPage'));
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage'));
const WishlistPage   = lazy(() => import('./pages/WishlistPage'));
```

Wrap the layout's `<Outlet />` in `<Suspense>` with a page-level fallback (a top-bar progress indicator or centered spinner).

Run `npm run build` and confirm `dist/assets/` has separate chunks for the lazy pages.

**Verify §1:**
- [ ] `npm run build` → `dist/assets/` shows e.g. `RoomsPage-{hash}.js` as a separate chunk.
- [ ] `npm run preview` + DevTools Network → navigating from `/login` to `/rooms` triggers a request for the `RoomsPage` chunk that wasn't downloaded on initial load.
- [ ] On slow throttling ("Slow 4G"), the `<Suspense fallback>` is visible during navigation (not a white flash).
- [ ] Hovering a `<Link to="/rooms/:id" onMouseEnter={() => import('./pages/RoomDetailPage')}>` preloads the chunk **before** the click — confirm in Network tab.

### 2. Add layered Error Boundaries

```bash
npm install react-error-boundary
```

- One **top-level** boundary around `<App />` — catches the catastrophic case
- One **per protected route** — so a crash in the room detail doesn't blank the layout
- One around the **wishlist widget** specifically — it's the most active surface and most likely to break

If you're using TanStack Query (Lesson 09), enable `throwOnError: true` on the query client so failed fetches reach the boundary.

**Verify §2:**
- [ ] In dev, temporarily add `throw new Error('boom')` inside `WishlistEditor` render → only the wishlist boundary's fallback shows; the rest of `RoomDetailPage` (header, members, etc.) keeps rendering.
- [ ] Remove the `throw`, log out, log back in → boundary auto-resets (use `resetKeys={[location.pathname]}` if you want navigation to reset).
- [ ] Click a button that calls `api.delete(...)` and the server returns 500 → if you wrapped the handler with `showBoundary(err)` (or use TanStack Query `throwOnError`), the boundary catches it. **Without** that promotion, the error is silently swallowed — confirm both behaviors so you understand the trap.

### 3. Build a reusable `<FormField>` with `useId`

Create `src/components/FormField.tsx` using the `forwardRef + useId` pattern shown above (the RHF-compatible version — your forms use RHF). Use it in **any new form** going forward.

> **Existing forms (`LoginForm`, `RegisterForm`) — refactor is OPTIONAL.** L08 §5 already wired `aria-invalid` / `aria-describedby` / matching `id`s manually, so they're a11y-correct. The refactor is purely cosmetic — the form body shrinks ~30% and you get the same a11y guarantees by default. Do it if the codebase smell of repetition bothers you; skip it otherwise.
>
> **`WishlistEditor` — do NOT wrap in `FormField`.** Each item row uses `<fieldset>` + `<legend>` + multiple inputs (name / url / priority). `<FormField>` assumes one label → one input. Wrapping each input separately would lose the per-row grouping. Either keep the inline labels you wrote in L08 §5, or factor a `<WishlistItemFields>` component that takes `index` and uses `useId` internally for **its** local error/hint IDs.

**Verify §3:**
- [ ] `FormField.tsx` is exported. New forms (e.g. a future "Edit profile" page) consume it via `<FormField label="…" {...register('field')} error={errors.field?.message} />`.
- [ ] If you refactored `LoginForm`/`RegisterForm`: existing tests/manual flow still pass — submit invalid input, see error span; tab order unchanged; screen reader still announces errors via `role="alert"`.

### 4. Optimistic updates — pick the right tool

You already added one optimistic mutation in **L09 §7** (Remove wishlist item, via TanStack Query `onMutate`). That's the production pattern for santa-app — keep it.

This section is about practising **`useOptimistic`** specifically, since it's a different mental model (React 19 transition + auto-rollback when the transition ends without committing). Pick **one** of:

**Option A — try `useOptimistic` standalone (recommended for the lesson).** On `AssigneeWishlist` (the giftee's list, built in L09 §5), add a per-item **"Mark as bought"** checkbox. The state is **local-only** (vanishes on reload) — there's no API for it; treat it as a personal scratchpad while you shop. Wrap the toggle in a `<form action={handler}>` and use `useOptimistic` + a fake `await new Promise(r => setTimeout(r, 400))` to simulate latency. The point is to **see** how `useOptimistic` works without entangling it with TanStack Query's cache.

**Option B — write-up only.** If you don't want a throwaway component, write a 2-paragraph note in `santa-app/notes/optimistic.md` comparing what `useOptimistic` *would* look like for the L09 wishlist-remove case (server-driven rollback, no manual snapshot/restore). No code, just understanding.

> Why not refactor the L09 wishlist-remove to `useOptimistic`? Because TanStack Query already owns that cache slot and `useOptimistic` doesn't know how to invalidate `['rooms', id, 'wishlist', 'me']`. The two patterns layer awkwardly when the same action also needs query invalidation. Use TanStack Query's `onMutate` when the cache cares; use `useOptimistic` for ephemeral / local-only UI.

**Verify §4 (Option A):**
- [ ] Click the "Mark as bought" checkbox → row shows a "saving…" badge instantly, before the fake `setTimeout` resolves.
- [ ] Inside the fake handler, `throw new Error('boom')` → badge disappears (transition ends, optimistic state dropped, no manual rollback code needed).
- [ ] Without the throw → after the fake delay, the row stays "bought" (you committed the state in your `handler` after the await).
- [ ] Reload the page → all "bought" toggles reset to unchecked (confirms it's local-only).

### 5. Profile a real interaction

Open React DevTools → Profiler. Record while you:
1. Click "Create Room" → fill the form → submit
2. Open a room with a long wishlist
3. Type rapidly into a search field (or any other text input)

Look for any component rendering more times than you'd expect or any commit > 50 ms. Document one finding (one paragraph, no fix required) — this is about *learning to read the Profiler*, not about hitting any specific number on a small santa-app.

**Verify §5:**
- [ ] Profiler records at least one commit; you can identify which component triggered it (state change vs parent re-render vs hook).
- [ ] Add the finding as a one-paragraph comment in `santa-app/notes/profiling.md` (or any local notes file). One concrete example: "Typing in the search input re-rendered the entire `RoomList` 8 times — `useDeferredValue` would defer the heavy `.filter()` to a non-urgent render."

### 6. (Optional) Virtualize the wishlist if it grows long

If your `WishlistEditor` could realistically hit 50+ items, swap the plain `.map()` for `@tanstack/react-virtual`. For ≤20 items it's not worth the complexity.

### What you have now

A santa-app that:
- Loads the login page in a fraction of the bundle
- Doesn't blank the screen when one widget throws
- Stays responsive during heavy renders
- Has accessible form fields by default
- Updates the UI before the server responds for one key action

Lesson 11 (Testing) is the last piece — tests that protect everything you built across Lessons 04-10.
