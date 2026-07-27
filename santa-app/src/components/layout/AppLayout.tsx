import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { NotificationBell } from './NotificationBell';

/** Shell for authenticated pages: sidebar on desktop, bottom nav on mobile. */
export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-border px-4">
          <NotificationBell />
        </header>
        <div className="container max-w-4xl py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
