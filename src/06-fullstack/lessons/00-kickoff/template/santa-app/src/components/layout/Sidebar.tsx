import { NavLink } from 'react-router-dom';
import { Gift, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { navItems } from './navItems';

/** Desktop navigation rail (hidden on mobile, where BottomNav takes over). */
export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Gift className="size-6 text-primary" />
        <span className="font-display text-lg font-bold">Secret Santa</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <p className="truncate px-3 text-sm font-medium">{user?.displayName}</p>
        <p className="truncate px-3 text-xs text-muted-foreground">{user?.email}</p>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={logout}>
          <LogOut className="size-4" /> Log out
        </Button>
      </div>
    </aside>
  );
}
