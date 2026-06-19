/**
 * Lazy routes + Suspense + preload-on-hover
 *
 * In a real Vite build, each lazy() import becomes a separate chunk.
 * This demo simulates the lazy boundary inline so it's runnable as a single file.
 *
 * In your own app, replace the inline `simulatedLazyPage(...)` with real `lazy()` imports:
 *
 *   const RoomsPage = lazy(() => import('./pages/RoomsPage'));
 *
 * To run: import <LazyRoutesDemo /> in App.tsx.
 */

import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router';

// ---- Simulate a slow chunk load ----

function simulatedLazyPage(name: string, delayMs: number) {
  return lazy(() =>
    new Promise<{ default: React.FC }>((resolve) => {
      setTimeout(() => {
        resolve({
          default: () => (
            <div style={{ padding: 20 }}>
              <h2>{name}</h2>
              <p>This page was loaded as a separate chunk after {delayMs}ms.</p>
            </div>
          ),
        });
      }, delayMs);
    }),
  );
}

const HomePage     = simulatedLazyPage('Home',           300);
const RoomsPage    = simulatedLazyPage('Rooms',         1200);
const SettingsPage = simulatedLazyPage('Settings',      1200);

// In a real app: const RoomsPage = lazy(() => import('./pages/RoomsPage'));
// To preload on hover, call import('./pages/RoomsPage') again — same module, same chunk.
// Since this demo uses inline factories, the hover preload re-evaluates the timeout.

function PageSpinner() {
  return <div style={{ padding: 20, textAlign: 'center' }}>Loading…</div>;
}

function Nav() {
  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
      <Link to="/">Home</Link>
      {/* In real code:
            onMouseEnter={() => import('./pages/RoomsPage')}
          starts the chunk download as soon as the user looks at the link. */}
      <Link to="/rooms">Rooms</Link>
      <Link to="/settings">Settings</Link>
    </nav>
  );
}

export default function LazyRoutesDemo() {
  // Force-mount toggle so you can see the loading fallback again
  const [key, setKey] = useState(0);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <BrowserRouter key={key}>
        <Nav />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <div style={{ padding: 12, borderTop: '1px solid #eee', marginTop: 20 }}>
        <button onClick={() => setKey((k) => k + 1)}>Reset (re-trigger lazy loading)</button>
      </div>
    </div>
  );
}
