import React, { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("login:", { email, password });
  }

  const isDisabled = !email || !password;

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="login form"
      className="flex w-80 flex-col gap-3 rounded-lg bg-(--surface) p-4 shadow"
    >
      <h3 className="text-lg font-semibold text-(--text)">Login</h3>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--muted)">Email</span>
        <input
          className="focus-visible:ring-brand w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-(--text) focus:outline-none focus-visible:ring-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--muted)">Password</span>
        <input
          className="focus-visible:ring-brand w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-(--text) focus:outline-none focus-visible:ring-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      <button
        type="submit"
        disabled={isDisabled}
        className="bg-brand hover:bg-brand-dark mt-2 rounded-md px-4 py-2 font-semibold text-(--button-text) transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        Sign in
      </button>
    </form>
  );
}
