import { Outlet, useLocation } from 'react-router-dom';
import { SocketNotifications } from '@/features/socket/SocketNotifications';
import { AppErrorBoundary } from '../AppErrorBoundary';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Suspense } from 'react';

/** Shell for authenticated pages: sidebar on desktop, bottom nav on mobile. */
export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen">
      <AppErrorBoundary>
        <Sidebar />
        <SocketNotifications />
        <BottomNav />
      </AppErrorBoundary>
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container max-w-4xl py-6">
          <AppErrorBoundary resetKeys={[pathname]}>
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Loading...</p>
              }
            >
              <Outlet />
            </Suspense>
          </AppErrorBoundary>
        </div>
      </main>
    </div>
  );
}
