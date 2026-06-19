/**
 * useOptimistic — React 19
 *
 * A "Like" button: increments instantly, even before the server responds.
 * If the server call fails, React rolls the state back automatically.
 *
 * Pairs with a form action — `useOptimistic` is designed to read alongside a
 * pending action so the UI shows the optimistic state while the action is in flight.
 *
 * Requires React 19. Run by importing <OptimisticDemo /> in App.tsx.
 */

import { useOptimistic, useState, useTransition } from 'react';

// ---- Fake API: 30% chance of failure ----

async function sendLike(): Promise<void> {
  await new Promise((resolve, reject) =>
    setTimeout(() => (Math.random() < 0.7 ? resolve(undefined) : reject(new Error('Like failed'))), 600),
  );
}

// ---- Component ----

export default function OptimisticDemo() {
  const [likes, setLikes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // The reducer takes the committed state and the optimistic value,
  // returns the next "rendered" state. React keeps using this rendered
  // state until the transition that called addOptimistic ends.
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (current, increment: number) => current + increment,
  );

  const handleClick = () => {
    startTransition(async () => {
      addOptimisticLike(1);             // UI updates immediately (reducer adds 1 to current)
      try {
        await sendLike();
        setLikes((c) => c + 1);          // commit the real state
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        // No manual rollback needed — when the transition ends without
        // committing the change to `likes`, React reverts to `likes`.
      }
    });
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', display: 'grid', gap: 12, maxWidth: 360 }}>
      <h2>Likes (with useOptimistic)</h2>

      <button onClick={handleClick} disabled={isPending}>
        ❤️ Like — currently {optimisticLikes}
      </button>

      <p style={{ color: '#666', fontSize: 13 }}>
        {isPending ? 'Sending…' : `Confirmed: ${likes}`}
      </p>

      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error} (UI rolled back)</p>}
    </div>
  );
}
