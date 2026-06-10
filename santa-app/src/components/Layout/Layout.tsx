import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="bg-surface border-edge sticky top-0 z-10 flex items-center justify-between border-b px-[clamp(1rem,4vw,3rem)] py-4">
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
              isActive ? 'text-brand font-semibold' : 'text-muted hover:text-fg font-medium'
            }
          >
            Rooms
          </NavLink>
          <div className="flex items-center gap-4">
            <span className="text-muted text-sm">{user?.name}</span>
            <button onClick={handleLogout} className="text-muted hover:text-fg text-sm font-medium">
              Logout
            </button>
          </div>
        </nav>
      </header>
      <Outlet />
    </>
  );
}
