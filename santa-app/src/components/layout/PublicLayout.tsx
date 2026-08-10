import { Outlet, useLocation } from 'react-router-dom';
import { AppErrorBoundary } from '../AppErrorBoundary';
import { Suspense } from 'react';

export function PublicLayout() {
  const { pathname } = useLocation();

  return (
    <AppErrorBoundary resetKeys={[pathname]}>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <Outlet />
      </Suspense>
    </AppErrorBoundary>
  );
}
