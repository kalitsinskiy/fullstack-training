import { useState } from "react";
import { clsx } from "clsx";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps = {}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  function validateName(v: string): string | null {
    return v.trim() ? null : "Name is required";
  }
  function validateEmail(v: string): string | null {
    if (!v.trim()) return "Email is required";
    if (!v.includes("@") || !v.includes(".")) return "Enter a valid email";
    return null;
  }
  function validatePassword(v: string): string | null {
    if (!v) return "Password is required";
    if (v.length < 8) return "Password must be at least 8 characters";
    return null;
  }
  function validateConfirm(v: string, pw: string): string | null {
    if (!v) return "Please confirm your password";
    if (v !== pw) return "Passwords don't match";
    return null;
  }

  const hasErrors =
    !!nameError ||
    !!emailError ||
    !!passwordError ||
    !!confirmError ||
    !name.trim() ||
    !email.trim() ||
    !password ||
    !confirm;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
    console.log("Register:", { name, email, password });
    onSuccess?.();
  };

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
          onBlur={() => setNameError(validateName(name))}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
        {nameError && <p className="text-danger text-xs">{nameError}</p>}
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
          onBlur={() => setEmailError(validateEmail(email))}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
        {emailError && <p className="text-danger text-xs">{emailError}</p>}
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
          onBlur={() => setPasswordError(validatePassword(password))}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
        {passwordError && (
          <p className="text-danger text-xs">{passwordError}</p>
        )}
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
          onBlur={() => setConfirmError(validateConfirm(confirm, password))}
          className="focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        />
        {confirmError && <p className="text-danger text-xs">{confirmError}</p>}
      </div>

      <button
        type="submit"
        disabled={hasErrors}
        className={clsx(
          "w-full rounded-md px-4 py-2 font-medium text-white transition-colors",
          "focus-visible:ring-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          hasErrors
            ? "bg-brand/40 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        Create Account
      </button>
    </form>
  );
}
