import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems } from './navItems';

/** Mobile bottom tab bar (hidden on desktop, where Sidebar takes over). */
export function BottomNav() {
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
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
