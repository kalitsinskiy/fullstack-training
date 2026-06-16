import { useState, type SyntheticEvent } from "react";

function validateName(value: string): string | null {
  if (!value) return "Name is required";
  return null;
}

function validateEmail(value: string): string | null {
  if (!value) return "Email is required";
  if (!value.includes("@") || !value.includes(".")) return "Enter a valid email address";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return null;
}

function validateConfirmPassword(value: string, password: string): string | null {
  if (!value) return "Please confirm your password";
  if (value !== password) return "Passwords don't match";
  return null;
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword, password);
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);
    if (nameErr || emailErr || passwordErr || confirmErr) return;
    console.log("Register payload:", { name, email, password });
  };

  const isDisabled =
    !name ||
    !email ||
    !password ||
    !confirmPassword ||
    !!nameError ||
    !!emailError ||
    !!passwordError ||
    !!confirmPasswordError;

  const inputClass =
    "focus-visible:outline-brand rounded-md border border-gray-300 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card p-card bg-surface w-full max-w-sm shadow-md"
    >
      <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <legend className="text-brand px-2 font-semibold">Account details</legend>

        <label htmlFor="register-name" className="font-medium">
          Full Name
        </label>
        <input
          id="register-name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          onBlur={(e) => setNameError(validateName(e.target.value))}
          className={inputClass}
        />
        {nameError && <p className="text-danger text-sm">{nameError}</p>}

        <label htmlFor="register-email" className="font-medium">
          Email Address
        </label>
        <input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          onBlur={(e) => setEmailError(validateEmail(e.target.value))}
          className={inputClass}
        />
        {emailError && <p className="text-danger text-sm">{emailError}</p>}

        <label htmlFor="register-password" className="font-medium">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
            if (confirmPassword) {
              setConfirmPasswordError(validateConfirmPassword(confirmPassword, e.target.value));
            }
          }}
          onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
          className={inputClass}
        />
        {passwordError && <p className="text-danger text-sm">{passwordError}</p>}

        <label htmlFor="register-confirm-password" className="font-medium">
          Confirm Password
        </label>
        <input
          id="register-confirm-password"
          type="password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setConfirmPasswordError(validateConfirmPassword(e.target.value, password));
          }}
          onBlur={(e) =>
            setConfirmPasswordError(validateConfirmPassword(e.target.value, password))
          }
          className={inputClass}
        />
        {confirmPasswordError && (
          <p className="text-danger text-sm">{confirmPasswordError}</p>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={isDisabled}
        className="bg-brand hover:bg-brand-dark disabled:hover:bg-brand mt-4 w-full rounded-md p-2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Create Account
      </button>
    </form>
  );
}
