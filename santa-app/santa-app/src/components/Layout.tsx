import { Suspense } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { ErrorFallback } from "./ErrorFallback";
import { PageSpinner } from "./PageSpinner";

export function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    auth.logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="bg-surface flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <Link to="/rooms" className="text-brand-dark text-lg font-semibold">
          Secret Santa
        </Link>
        <nav className="flex items-center gap-4">
          <NavLink
            to="/rooms"
            className={({ isActive }) =>
              isActive ? "text-brand font-medium underline" : "text-gray-600 hover:text-gray-900"
            }
          >
            Rooms
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <CreateRoomDialog />
          <span className="text-sm text-gray-600">{auth.user?.displayName}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="p-6">
        <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
}
