import React, { useState } from "react";
import type ValidationError from "../utils/ValidationError";
import Validate from "../utils/Validation";
import ValidationList from "./ValidationList";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [nameErrors, setNameErrors] = useState<ValidationError[]>([]);
  const [emailErrors, setEmailErrors] = useState<ValidationError[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<ValidationError[]>([]);
  const [confirmErrors, setConfirmErrors] = useState<ValidationError[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameValidationErrors = Validate.name(name);
    const emailValidationErrors = Validate.email(email);
    const passwordValidationErrors = Validate.password(password);
    const confirmValidationErrors = Validate.confirmPassword(password, confirm);

    setNameErrors(nameValidationErrors);
    setEmailErrors(emailValidationErrors);
    setPasswordErrors(passwordValidationErrors);
    setConfirmErrors(confirmValidationErrors);

    if (
      nameValidationErrors.length > 0 ||
      emailValidationErrors.length > 0 ||
      passwordValidationErrors.length > 0 ||
      confirmValidationErrors.length > 0
    ) {
      console.error("validation errors:");
      return;
    }

    console.info("register:", { name, email, password, confirm });
  }

  const isDisabled = !name || !email || !password || !confirm;

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="register form"
      className="flex w-[360px] flex-col gap-3 rounded-lg bg-(--surface) p-4 shadow"
    >
      <h3 className="text-lg font-semibold text-(--text)">Register</h3>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--muted)">Full name</span>
        <input
          className="focus-visible:ring-brand w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-(--text) focus:outline-none focus-visible:ring-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <ValidationList errors={nameErrors} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--muted)">Email</span>
        <input
          className="focus-visible:ring-brand w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-(--text) focus:outline-none focus-visible:ring-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <ValidationList errors={emailErrors} />
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
        <ValidationList errors={passwordErrors} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--muted)">Confirm password</span>
        <input
          className="focus-visible:ring-brand w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-(--text) focus:outline-none focus-visible:ring-2"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <ValidationList errors={confirmErrors} />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark rounded-md px-4 py-2 font-semibold text-(--button-text) transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDisabled}
        >
          Create account
        </button>
      </div>
    </form>
  );
}
