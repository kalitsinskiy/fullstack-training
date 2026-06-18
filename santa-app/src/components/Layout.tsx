import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  return (
    <div className="relative min-h-svh overflow-x-clip bg-(--bg) text-(--text)">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(76,175,80,0.18),transparent_32%),radial-gradient(circle_at_92%_14%,rgba(45,90,39,0.12),transparent_34%),linear-gradient(180deg,var(--bg),color-mix(in_oklab,var(--surface)_82%,white))]"
      />

      <header className="sticky top-0 z-20 border-b border-(--border) bg-[color-mix(in_oklab,var(--bg)_82%,white)]/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/rooms"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-(--surface)"
          >
            <span className="bg-brand inline-flex h-8 w-8 items-center justify-center rounded-full font-black text-(--button-text)">
              SS
            </span>
            <span className="text-base font-semibold tracking-[0.02em] sm:text-lg">
              Secret Santa
            </span>
          </Link>

          <nav className="ml-1 flex items-center gap-2">
            <NavLink
              to="/rooms"
              className={({ isActive }) =>
                [
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  isActive
                    ? "bg-brand text-(--button-text) shadow"
                    : "text-(--muted) hover:bg-(--surface) hover:text-(--text)",
                ].join(" ")
              }
            >
              Rooms
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-44 truncate rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-sm text-(--muted) sm:inline-block">
              {auth.user?.displayName}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-(--border) bg-(--surface) px-3 py-1.5 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-(--bg) hover:shadow"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet /> {/* protected page renders here */}
      </main>
    </div>
  );
}
