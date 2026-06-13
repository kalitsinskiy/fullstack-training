import { useState } from "react";
import clsx from "clsx";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isEmpty = !email.trim() || !password.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("login", { email, password });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card p-card flex w-full max-w-sm flex-col gap-4 bg-white shadow-sm"
    >
      <h2 className="text-brand text-xl font-semibold">Sign In</h2>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="login-email"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="login-password"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isEmpty}
        className={clsx(
          "rounded px-4 py-2 text-sm font-medium text-white transition-colors",
          isEmpty
            ? "bg-brand/50 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        Sign In
      </button>
    </form>
  );
}
