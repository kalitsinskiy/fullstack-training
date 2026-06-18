import { useState } from 'react';
import { CalendarPlus2, UserPlus } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { CreateRoomDialog } from '../CreateRoomDialog';
import { JoinRoomDialog } from '../JoinRoomDialog';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ThemeToggle/TheeToggle';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);

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
        <nav className="flex items-center gap-4">
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
            onClick={() => setCreateRoomOpen(true)}
            aria-label="Create Room"
            title="Create Room"
            className="text-muted-foreground hover:bg-muted rounded-base flex cursor-pointer items-center justify-center p-1.5 transition-colors"
          >
            <CalendarPlus2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => setJoinRoomOpen(true)}
            aria-label="Join Room"
            title="Join Room"
            className="text-muted-foreground hover:bg-muted rounded-base flex cursor-pointer items-center justify-center p-1.5 transition-colors"
          >
            <UserPlus size={15} />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">
              Howdy, <strong>{user?.name}</strong>
            </span>
            <span className="text-muted-foreground">|</span>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium"
            >
              Logout
            </button>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <CreateRoomDialog open={createRoomOpen} onOpenChange={setCreateRoomOpen} />
      <JoinRoomDialog open={joinRoomOpen} onOpenChange={setJoinRoomOpen} />

      <Outlet />
    </>
  );
}
