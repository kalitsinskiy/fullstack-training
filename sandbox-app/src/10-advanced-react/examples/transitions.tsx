/**
 * useTransition + useDeferredValue
 *
 * Two ways to keep the UI responsive when a state update triggers heavy work.
 *
 * Demo: filter 10,000 items by substring.
 *   - Without a transition: each keystroke locks the input until filtering finishes.
 *   - With useTransition: input stays buttery; filtering happens in the background.
 */

import { useState, useTransition, useDeferredValue, useMemo } from 'react';

// ---- 10,000 fake rooms ----

const allRooms = Array.from({ length: 10_000 }, (_, i) => ({
  id: String(i),
  name: `Room #${i} — ${['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'][i % 5]}`,
}));

// Slow filter — pretend each item check is expensive
function slowFilter(query: string) {
  // Burn cycles to make the demo's lag visible
  const start = performance.now();
  while (performance.now() - start < 5) { /* spin */ }
  return allRooms.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
}

// ---- Variant 1: useTransition ----
//
// The state update for the *filter* is wrapped in startTransition.
// The state update for the *input value* is NOT — the input stays responsive.

function TransitionDemo() {
  const [query, setQuery] = useState('');
  const [filterText, setFilterText] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    startTransition(() => setFilterText(e.target.value));
  };

  const filtered = useMemo(() => (filterText ? slowFilter(filterText) : allRooms), [filterText]);

  return (
    <section style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6, marginBottom: 12 }}>
      <h3>useTransition</h3>
      <input value={query} onChange={handleChange} placeholder="Search rooms…" style={{ padding: 6, width: 280 }} />
      <p style={{ color: '#666', fontSize: 13 }}>
        {isPending ? <em>Filtering…</em> : `${filtered.length.toLocaleString()} matching`}
      </p>
      <ul style={{ height: 220, overflow: 'auto', opacity: isPending ? 0.6 : 1 }}>
        {filtered.slice(0, 50).map((r) => <li key={r.id}>{r.name}</li>)}
      </ul>
    </section>
  );
}

// ---- Variant 2: useDeferredValue ----
//
// The query value is "deferred" — components consuming it lag behind the input.
// Use this when you don't control where the state update happens (e.g. it's
// a prop coming from a parent).

function DeferredDemo({ query }: { query: string }) {
  const deferred = useDeferredValue(query);
  const isStale = deferred !== query;

  const filtered = useMemo(() => (deferred ? slowFilter(deferred) : allRooms), [deferred]);

  return (
    <section style={{ padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
      <h3>useDeferredValue</h3>
      <p style={{ color: '#666', fontSize: 13 }}>
        {isStale ? <em>Filtering…</em> : `${filtered.length.toLocaleString()} matching`}
      </p>
      <ul style={{ height: 220, overflow: 'auto', opacity: isStale ? 0.6 : 1 }}>
        {filtered.slice(0, 50).map((r) => <li key={r.id}>{r.name}</li>)}
      </ul>
    </section>
  );
}

export default function TransitionsApp() {
  const [outerQuery, setOuterQuery] = useState('');

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1>Transitions</h1>
      <p style={{ color: '#666' }}>
        Two demos. Type quickly into either input — the input itself should stay snappy
        even though filtering 10,000 items takes ~50 ms.
      </p>

      <TransitionDemo />

      <input
        value={outerQuery}
        onChange={(e) => setOuterQuery(e.target.value)}
        placeholder="Search rooms (parent-controlled)…"
        style={{ padding: 6, width: 280, marginBottom: 12 }}
      />
      <DeferredDemo query={outerQuery} />
    </div>
  );
}
