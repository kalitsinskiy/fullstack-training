import React, { useState } from "react";
import type ValidationError from "../utils/ValidationError";
import Validate from "../utils/Validation";
import ValidationList from "./ValidationList";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="register-name"
          className="text-muted-foreground text-sm"
        >
          Full name
        </Label>
        <Input
          id="register-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <ValidationList errors={nameErrors} />
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="register-email"
          className="text-muted-foreground text-sm"
        >
          Email
        </Label>
        <Input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <ValidationList errors={emailErrors} />
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="register-password"
          className="text-muted-foreground text-sm"
        >
          Password
        </Label>
        <Input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <ValidationList errors={passwordErrors} />
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="register-confirm"
          className="text-muted-foreground text-sm"
        >
          Confirm password
        </Label>
        <Input
          id="register-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <ValidationList errors={confirmErrors} />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          className="bg-brand hover:bg-brand-dark h-10 rounded-md px-4 font-semibold text-(--button-text)"
          disabled={isDisabled}
        >
          Create account
        </Button>
      </div>
    </form>
  );
}
