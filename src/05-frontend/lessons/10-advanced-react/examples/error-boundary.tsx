/**
 * Error Boundaries with react-error-boundary
 *
 * Demonstrates:
 *   - A catch-all top-level boundary
 *   - Per-widget boundaries (one widget crashes, the rest of the page survives)
 *   - resetKeys — auto-reset when input changes
 *   - The fact that async errors in event handlers DON'T propagate by default
 *     (you must surface them yourself, e.g. via setState that throws on next render)
 *
 * Setup:
 *   npm install react-error-boundary
 */

import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';
import { useState } from 'react';

// ---- A reusable fallback ----

function Fallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" style={{ padding: 12, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6 }}>
      <p style={{ margin: 0, color: '#991b1b', fontWeight: 600 }}>Something went wrong</p>
      <pre style={{ fontSize: 12, color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// ---- A buggy component to demonstrate the catch ----

function BuggyCounter() {
  const [count, setCount] = useState(0);
  if (count === 3) throw new Error('I crashed at count = 3');
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <p style={{ fontSize: 12, color: '#666' }}>(Will crash at 3)</p>
    </div>
  );
}

// ---- A safe sibling — should keep working when BuggyCounter crashes ----

function HealthyClock() {
  const [now, setNow] = useState(new Date());
  return (
    <div>
      <p>Time: {now.toLocaleTimeString()}</p>
      <button onClick={() => setNow(new Date())}>Refresh</button>
    </div>
  );
}

// ---- Async errors — the trick ----
//
// Async errors (in fetch().catch, in onClick handlers) don't reach the boundary.
// Two patterns to surface them:
//   1. setState an error and throw on next render
//   2. Use the showBoundary helper from useErrorBoundary

function AsyncFailButton() {
  const { showBoundary } = useErrorBoundary();

  const handleClick = async () => {
    try {
      await new Promise((_, reject) => setTimeout(() => reject(new Error('Async API failure')), 500));
    } catch (err) {
      // `err` is `unknown` after `catch` in strict TS — narrow before passing on
      showBoundary(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return <button onClick={handleClick}>Trigger async error</button>;
}

// ---- The whole demo, with layered boundaries ----

export default function ErrorBoundaryDemo() {
  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', display: 'grid', gap: 16 }}>
      <h1>Layered Error Boundaries</h1>
      <p style={{ color: '#666' }}>
        Each widget is wrapped independently — a crash in one doesn't blank the others.
      </p>

      <ErrorBoundary FallbackComponent={Fallback}>
        <section style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h3>Buggy counter (crashes at 3)</h3>
          <BuggyCounter />
        </section>
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={Fallback}>
        <section style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h3>Healthy clock (independent)</h3>
          <HealthyClock />
        </section>
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={Fallback}>
        <section style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <h3>Async error (use showBoundary)</h3>
          <AsyncFailButton />
        </section>
      </ErrorBoundary>
    </div>
  );
}
