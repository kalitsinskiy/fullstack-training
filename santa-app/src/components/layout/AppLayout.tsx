import { ErrorBoundary } from 'react-error-boundary';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorFallback } from '../ErrorFallback';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

/** Shell for authenticated pages: sidebar on desktop, bottom nav on mobile. */
export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container max-w-4xl py-6">
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[pathname]}
          >
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
