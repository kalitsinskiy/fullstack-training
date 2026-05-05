/**
 * Exercise: Wrap a route with Suspense + ErrorBoundary
 *
 * Take the lazy-loaded RoomsPage below and wrap it so that:
 * 1. While the chunk is loading → a `<PageSpinner />` is shown
 * 2. If the page throws after loading → an `<ErrorFallback />` is shown
 *    with a "Try again" button that re-mounts the page
 * 3. The rest of the layout (Nav) keeps working in either state
 *
 * Bonus:
 * 4. The ErrorBoundary should auto-reset when the user navigates to a
 *    different route (use `resetKeys` and the current pathname)
 *
 * Setup:
 *   npm install react-error-boundary
 *
 * Run by importing <Demo /> in App.tsx.
 */

/* eslint-disable */
// @ts-nocheck — exercise stub. Remove this directive after implementing.

import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import { ErrorBoundary } from 'react-error-boundary';

// ---- Lazy chunks ----

const RoomsPage = lazy(() =>
  new Promise<{ default: React.FC }>((resolve) => {
    setTimeout(() => {
      resolve({
        default: function RoomsPageImpl() {
          // 30% chance to throw on render to test the error boundary
          if (Math.random() < 0.3) throw new Error('RoomsPage failed to mount');
          return (
            <div style={{ padding: 16 }}>
              <h2>Rooms</h2>
              <p>List of rooms (stub).</p>
            </div>
          );
        },
      });
    }, 800);
  }),
);

const AboutPage = lazy(() =>
  new Promise<{ default: React.FC }>((resolve) => {
    setTimeout(() => resolve({ default: () => <div style={{ padding: 16 }}><h2>About</h2></div> }), 400);
  }),
);

// ---- Provided fallbacks ----

function PageSpinner() {
  return <div style={{ padding: 16, color: '#666' }}>Loading…</div>;
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" style={{ padding: 12, background: '#fee2e2', borderRadius: 6, margin: 16 }}>
      <p style={{ color: '#991b1b', fontWeight: 600 }}>Something went wrong:</p>
      <pre style={{ fontSize: 12 }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// ---- Nav (keep working regardless of route state) ----

function Nav() {
  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
      <Link to="/">About</Link>
      <Link to="/rooms">Rooms</Link>
    </nav>
  );
}

// ---- TODO: Wrap the routes ----

function RoutedContent() {
  // const location = useLocation();
  // TODO: wrap <Routes> with <Suspense fallback={<PageSpinner />}> and
  // <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
  return (
    <Routes>
      <Route path="/" element={<AboutPage />} />
      <Route path="/rooms" element={<RoomsPage />} />
    </Routes>
  );
}

export default function Demo() {
  // Force-remount so the lazy() factory re-runs and you see loading + crash again
  const [key, setKey] = useState(0);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <BrowserRouter key={key}>
        <Nav />
        <RoutedContent />
      </BrowserRouter>
      <button onClick={() => setKey((k) => k + 1)} style={{ margin: 12 }}>
        Reset (re-trigger lazy + boundary)
      </button>
    </div>
  );
}
