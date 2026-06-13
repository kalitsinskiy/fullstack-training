import { useState, type FormEvent } from "react";
import clsx from "clsx";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  function validateName(value: string) {
    if (!value.trim()) return "Name is required";
    return null;
  }

  function validateEmail(value: string) {
    if (!value.trim()) return "Email is required";
    if (!value.includes("@") || !value.includes("."))
      return "Enter a valid email";
    return null;
  }

  function validatePassword(value: string) {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  function validateConfirm(value: string, pw: string) {
    if (!value) return "Please confirm your password";
    if (value !== pw) return "Passwords don't match";
    return null;
  }

  const hasErrors =
    !!nameError || !!emailError || !!passwordError || !!confirmError;
  const isEmpty =
    !name.trim() || !email.trim() || !password.trim() || !confirm.trim();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirm(confirm, password);
    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (nErr || eErr || pErr || cErr) return;
    console.log("register", { name, email, password });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card p-card flex w-full max-w-sm flex-col gap-4 bg-white shadow-sm"
    >
      <h2 className="text-brand text-xl font-semibold">Create Account</h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="reg-name">
          Name
        </label>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setNameError(validateName(name))}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="Taras Shevchenko"
        />
        {nameError && <p className="text-xs text-red-500">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="reg-email"
        >
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailError(validateEmail(email))}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="you@example.com"
        />
        {emailError && <p className="text-xs text-red-500">{emailError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="reg-password"
        >
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setPasswordError(validatePassword(password))}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="••••••••"
        />
        {passwordError && (
          <p className="text-xs text-red-500">{passwordError}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="reg-confirm"
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (confirmError)
              setConfirmError(validateConfirm(e.target.value, password));
          }}
          onBlur={() => setConfirmError(validateConfirm(confirm, password))}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="••••••••"
        />
        {confirmError && <p className="text-xs text-red-500">{confirmError}</p>}
      </div>

      <button
        type="submit"
        disabled={hasErrors || isEmpty}
        className={clsx(
          "rounded px-4 py-2 text-sm font-medium text-white transition-colors",
          hasErrors || isEmpty
            ? "bg-brand/50 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        Create Account
      </button>
    </form>
  );
}
