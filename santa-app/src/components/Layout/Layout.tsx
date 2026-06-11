import { useState } from 'react';
import { Plus } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { CreateRoomDialog } from '../CreateRoomDialog';
import { useAuth } from '../../hooks/useAuth';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="bg-card border-border sticky top-0 z-10 flex items-center justify-between border-b px-[clamp(1rem,4vw,3rem)] py-4">
        <NavLink
          to="/rooms"
          className="from-brand-dark to-brand-warm bg-linear-to-r bg-clip-text text-lg font-extrabold text-transparent"
        >
          Secret Santa
        </NavLink>
        <nav className="flex items-center gap-6">
          <NavLink
            to="/rooms"
            className={({ isActive }) =>
              isActive
                ? 'text-brand font-semibold'
                : 'text-muted-foreground hover:text-foreground font-medium'
            }
          >
            Rooms
          </NavLink>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            aria-label="Create Room"
            className="text-muted-foreground hover:bg-muted rounded-base flex items-center justify-center p-1.5 transition-colors"
          >
            <Plus size={15} />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <CreateRoomDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <Outlet />
    </>
  );
}
