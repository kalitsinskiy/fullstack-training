import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

export function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false);

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
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCreateRoomDialogOpen(true)}
              title="Create a new room"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="text-muted-foreground hidden max-w-44 truncate rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-sm sm:inline-block">
              {auth.user?.displayName}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="h-9 px-3 text-sm font-semibold"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet /> {/* protected page renders here */}
      </main>

      <CreateRoomDialog
        open={createRoomDialogOpen}
        onOpenChange={setCreateRoomDialogOpen}
      />
    </div>
  );
}
