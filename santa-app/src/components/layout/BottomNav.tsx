import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { navItems } from './navItems';

/** Mobile bottom tab bar (hidden on desktop, where Sidebar takes over). */
export function BottomNav() {
  const unreadCount = useUnreadCount();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-card md:hidden">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <span className="relative">
            <Icon className="size-5" />
            {to === '/notifications' && unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
