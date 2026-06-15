import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  return (
    <>
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <Link to="/rooms" className="text-brand text-lg font-bold">
          Secret Santa
        </Link>
        <nav className="flex items-center gap-4">
          <NavLink
            to="/rooms"
            className={({ isActive }) =>
              isActive ? "text-brand font-semibold" : "text-gray-600 hover:text-gray-900"
            }
          >
            Rooms
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{auth.user?.displayName}</span>
          <button
            onClick={handleLogout}
            className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="min-h-screen bg-gray-100 p-6">
        <Outlet />
      </main>
    </>
  );
}
