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

import React, { useEffect, useState } from 'react';

interface Notification {
  id: string;
  text: string;
  read: boolean;
}

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
  const prev = store[idx]!;
  const next: Notification = { ...prev, read: value };
  store = store.map((n, i) => (i === idx ? next : n));
  return next;
}

// ---- Implementation: Optimistic toggle with manual state management ----

export default function OptimisticToggleDemo() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pending, setPending] = useState<Map<string, boolean>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listNotifications().then(setNotifications);
  }, []);

  const handleToggle = async (id: string, nextValue: boolean) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: nextValue } : n)));

    setPending((prev) => new Map(prev).set(id, true));
    setError(null);

    try {
      await setRead(id, nextValue);
    } catch (err) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !nextValue } : n)));
      setError((err as Error).message);
    } finally {
      setPending((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h2>Notifications</h2>
      {error && <p style={{ color: '#d32f2f', marginBottom: 12 }}>Error: {error}</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notifications.map((n) => (
          <li
            key={n.id}
            style={{
              padding: 8,
              borderBottom: '1px solid #eee',
              opacity: pending.has(n.id) ? 0.5 : n.read ? 0.6 : 1,
              transition: 'opacity 0.2s',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{n.text}</span>
            <button
              onClick={() => handleToggle(n.id, !n.read)}
              disabled={pending.has(n.id)}
              style={{
                opacity: pending.has(n.id) ? 0.6 : 1,
              }}
            >
              {pending.has(n.id)
                ? n.read
                  ? 'Marking unread…'
                  : 'Marking read…'
                : n.read
                  ? 'Mark unread'
                  : 'Mark read'}
            </button>
          </li>
        ))}
      </ul>

      <p style={{ color: '#777', fontSize: 14 }}>
        The fake API has a {Math.round(FAIL_RATE * 100)}% failure rate so you can verify rollback.
      </p>
    </div>
  );
}
