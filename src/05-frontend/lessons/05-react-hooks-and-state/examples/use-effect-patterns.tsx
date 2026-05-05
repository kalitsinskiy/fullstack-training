// ============================================
// useEffect Patterns
// ============================================
// This file demonstrates the most common useEffect patterns:
// data fetching, event listeners, timers, and dependency array usage.

import { useState, useEffect } from 'react';

// ---- Types ----

interface User {
  id: number;
  name: string;
  email: string;
}

// ---- Pattern 1: Data Fetching ----
// Fetch data when a dependency (userId) changes.
// Uses a `cancelled` flag to avoid updating state after unmount.

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchUser() {
      try {
        const res = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: User = await res.json();
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    }

    fetchUser();

    // Cleanup: if userId changes before the fetch completes, cancel the old one
    return () => {
      cancelled = true;
    };
  }, [userId]); // re-run only when userId changes

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return null;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// ---- Pattern 2: Event Listener with Cleanup ----
// Adds a global event listener on mount, removes on unmount.

function WindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup: remove listener when component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // empty array = run once on mount

  return (
    <p>
      Window: {size.width} x {size.height}
    </p>
  );
}

// ---- Pattern 3: Timer / Interval ----
// Sets up an interval on mount, clears it on unmount.

function StopWatch() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return; // no interval if paused

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // Cleanup: clear interval when running changes or component unmounts
    return () => clearInterval(interval);
  }, [running]); // re-run when running changes

  return (
    <div>
      <p>{seconds}s</p>
      <button onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Start'}</button>
      <button onClick={() => setSeconds(0)}>Reset</button>
    </div>
  );
}

// ---- Pattern 4: Document Title Sync ----
// Syncs a value to an external system (document title).

function NotificationBadge({ count }: { count: number }) {
  useEffect(() => {
    document.title = count > 0 ? `(${count}) My App` : 'My App';

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'My App';
    };
  }, [count]);

  return <span>{count > 0 ? `${count} new` : 'No new notifications'}</span>;
}

// ---- Pattern 5: Dependency Array Comparison ----
// Shows the difference between no deps, empty deps, and specific deps.

function DependencyDemo({ value }: { value: string }) {
  // Runs after EVERY render — usually not what you want
  useEffect(() => {
    console.log('[no deps] Runs on every render');
  });

  // Runs ONCE on mount
  useEffect(() => {
    console.log('[empty deps] Runs once on mount');
  }, []);

  // Runs when `value` changes
  useEffect(() => {
    console.log(`[value dep] value changed to: ${value}`);
  }, [value]);

  return <p>Value: {value}</p>;
}

// ---- App (combines all patterns) ----

export default function UseEffectPatternsApp() {
  const [userId, setUserId] = useState(1);
  const [notifications, setNotifications] = useState(0);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>useEffect Patterns</h1>

      <section>
        <h3>Data Fetching</h3>
        <div>
          {[1, 2, 3].map((id) => (
            <button key={id} onClick={() => setUserId(id)} disabled={userId === id}>
              User {id}
            </button>
          ))}
        </div>
        <UserProfile userId={userId} />
      </section>

      <section>
        <h3>Event Listener (resize window)</h3>
        <WindowSize />
      </section>

      <section>
        <h3>Timer</h3>
        <StopWatch />
      </section>

      <section>
        <h3>Document Title</h3>
        <button onClick={() => setNotifications((n) => n + 1)}>Add Notification</button>
        <button onClick={() => setNotifications(0)}>Clear</button>
        <NotificationBadge count={notifications} />
      </section>

      <section>
        <h3>Dependency Array (check console)</h3>
        <DependencyDemo value={String(userId)} />
      </section>
    </div>
  );
}
