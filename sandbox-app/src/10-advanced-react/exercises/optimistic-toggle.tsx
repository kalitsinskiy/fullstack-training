/**
 * Exercise: Optimistic "mark as read" toggle
 *
 * You have a list of notifications, each with `read: boolean`.
 * Build a toggle that:
 *
 * 1. Updates the UI INSTANTLY when the user clicks
 * 2. Calls the (fake, slow, unreliable) `setRead(id, value)` API
 * 3. If the API rejects, ROLLS BACK the change automatically
 * 4. While the API call is in flight, the row should look slightly faded
 *    (so the user knows the change isn't confirmed yet)
 *
 * Pick ONE of two approaches:
 *
 *   A) useOptimistic + form action (React 19)
 *      — wrap the toggle in a <form action={handler}> and use useOptimistic
 *
 *   B) TanStack Query + onMutate (Lesson 09)
 *      — useMutation with onMutate / onError / onSettled
 *
 * Both are valid. Approach B is more common in santa-app since the rest of
 * the app already uses TanStack Query; Approach A is simpler if you only
 * need the optimistic behavior in one spot.
 */

import { useState, useEffect, useOptimistic, useTransition } from 'react';

interface Notification {
  id: string;
  text: string;
  read: boolean;
}

type Row = Notification & { pending?: boolean };

// ---- Fake API ----

let store: Notification[] = [
  { id: '1', text: 'Welcome to santa-app!', read: false },
  { id: '2', text: 'Alice joined "Office Party"', read: false },
  { id: '3', text: 'Wishlist updated', read: true },
];
const FAIL_RATE = 0.3;

async function listNotifications(): Promise<Notification[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [...store];
}

async function setRead(id: string, value: boolean): Promise<Notification> {
  await new Promise((r) => setTimeout(r, 600)); // slow on purpose
  if (Math.random() < FAIL_RATE) throw new Error('Server rejected the toggle');
  const idx = store.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('Not found');
  const next = { ...store[idx], read: value };
  store = store.map((n, i) => (i === idx ? next : n));
  return next;
}

// ---- TODO: implement the optimistic toggle ----

export default function OptimisticToggleDemo() {
  // Approach A — useOptimistic
  //   const [optimistic, addOptimistic] = useOptimistic(notifications, reducer);
  //   const handleToggle = (id, next) => {
  //     startTransition(async () => {
  //       addOptimistic({ id, read: next });
  //       try { await setRead(id, next); commitToList(); }
  //       catch { setError(...); }
  //     });
  //   };
  //
  // Approach B — TanStack Query
  //   const toggle = useMutation({
  //     mutationFn: ({ id, value }) => setRead(id, value),
  //     onMutate: ...,
  //     onError: ...,
  //     onSettled: ...,
  //   });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  // TODO: load notifications on mount (useQuery for B, useEffect+useState for A)
  // Chosen Approach - A
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    listNotifications().then(setNotifications);
  }, []);

  const [optimistic, applyOptimistic] = useOptimistic<Row[], { id: string; read: boolean }>(
    notifications,
    (current, patch) =>
      current.map((n) => (n.id === patch.id ? { ...n, read: patch.read, pending: true } : n))
  );

  function handleToggle(id: string, next: boolean) {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ id, read: next });
      try {
        const updated = await setRead(id, next);
        setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Toggle failed');
      }
    });
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h2>Notifications</h2>
      {/* <p>TODO: render notifications with an optimistic toggle.</p> */}
      {error && (
        <p role="alert" style={{ color: '#b91c1c' }}>
          {error} (rolled back)
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {optimistic.map((n) => (
          <li
            key={n.id}
            style={{
              padding: 8,
              borderBottom: '1px solid #eee',
              opacity: n.read ? 0.6 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ textDecoration: n.read ? 'line-through' : 'none' }}>{n.text}</span>
            <button onClick={() => handleToggle(n.id, !n.read)} disabled={n.pending}>
              {n.read ? 'Mark unread' : 'Mark read'}
            </button>
          </li>
        ))}
      </ul>

      <p style={{ color: '#666', fontSize: 13 }}>
        The fake API has a {Math.round(FAIL_RATE * 100)}% failure rate so you can verify rollback.
      </p>
    </div>
  );
}
