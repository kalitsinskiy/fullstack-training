import { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { RoomList } from "./components/RoomList";

type View = "login" | "register" | "rooms";

function App() {
  const [view, setView] = useState<View>("rooms");
  const [darkMode, setDarkMode] = useState(false);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
  }

  return (
    <div className="bg-bg-base text-text-base min-h-screen transition-colors">
      <header className="bg-brand sticky top-0 z-10 flex items-center justify-between px-6 py-3 text-white shadow">
        <h1 className="text-xl font-semibold tracking-wide">Secret Santa</h1>
        <nav className="flex items-center gap-3">
          {(["login", "register", "rooms"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`hover:text-brand rounded-full border border-white/50 px-3 py-0.5 text-sm capitalize transition-colors hover:bg-white ${view === v ? "text-brand bg-white" : ""}`}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            className="hover:text-brand ml-2 rounded-full border border-white/50 px-3 py-0.5 text-sm transition-colors hover:bg-white"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀ Light" : "☾ Dark"}
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {view === "login" && <LoginForm />}
        {view === "register" && <RegisterForm />}
        {view === "rooms" && <RoomList />}
      </main>
    </div>
  );
}

export default App;
