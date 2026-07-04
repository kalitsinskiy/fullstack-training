import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

/** Shell for authenticated pages: sidebar on desktop, bottom nav on mobile. */
export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container max-w-4xl py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
