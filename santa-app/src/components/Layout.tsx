import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { CreateRoomDialog } from "./CreateRoomDialog";

export function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full border border-white/50 px-3 py-0.5 text-sm capitalize transition-colors hover:bg-white hover:text-brand ${isActive ? "bg-white text-brand" : ""}`;

  return (
    <>
      <header className="bg-brand sticky top-0 z-10 flex items-center justify-between px-6 py-3 text-white shadow">
        <Link
          to="/rooms"
          className="text-xl font-semibold tracking-wide text-white no-underline"
        >
          Secret Santa
        </Link>
        <nav className="flex items-center gap-3">
          <NavLink to="/rooms" className={navLinkClass}>
            Rooms
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <CreateRoomDialog />
          <span className="text-sm">{auth.user?.displayName}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="hover:text-brand rounded-full border border-white/50 px-3 py-0.5 text-sm transition-colors hover:bg-white"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </>
  );
}
