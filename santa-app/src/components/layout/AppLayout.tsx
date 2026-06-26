import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { SocketNotifications } from '@/features/realtime/SocketNotifications';
import { SocketProvider } from '@/features/realtime/SocketProvider';

/** Shell for authenticated pages: sidebar on desktop, bottom nav on mobile. */
export function AppLayout() {
  return (
    <SocketProvider>
      <div className="flex min-h-screen">
        <SocketNotifications />
        <Sidebar />
        <main className="flex-1 pb-20 md:pb-0">
          <header className="flex items-center justify-end border-b border-border px-6 py-3">
            <NotificationBell />
          </header>
          <div className="container max-w-4xl py-6">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </SocketProvider>
  );
}
