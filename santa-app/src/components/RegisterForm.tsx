import { useState } from "react";
import { clsx } from "clsx";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const isEmpty = !name.trim() || !email.trim() || !password || !confirm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Register:", { name, email, password, confirm });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card bg-surface p-card mx-auto w-full max-w-sm shadow-md"
    >
      <h2 className="text-brand mb-6 text-2xl font-semibold">Create Account</h2>

      <div className="mb-4 flex flex-col gap-1">
        <label
          htmlFor="reg-name"
          className="text-text-muted text-sm font-medium"
        >
          Name
        </label>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
      </div>

      <div className="mb-4 flex flex-col gap-1">
        <label
          htmlFor="reg-email"
          className="text-text-muted text-sm font-medium"
        >
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
      </div>

      <div className="mb-4 flex flex-col gap-1">
        <label
          htmlFor="reg-password"
          className="text-text-muted text-sm font-medium"
        >
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <label
          htmlFor="reg-confirm"
          className="text-text-muted text-sm font-medium"
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
      </div>

      <button
        type="submit"
        disabled={isEmpty}
        className={clsx(
          "w-full rounded-md px-4 py-2 font-medium text-white transition-colors",
          "focus-visible:ring-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          isEmpty
            ? "bg-brand/40 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        Create Account
      </button>
    </form>
  );
}
