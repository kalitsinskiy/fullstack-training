import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useAuth } from "../contexts/AuthContext";
import { LoginSchema, type LoginInput } from "../schemas/auth";

interface LoginFormProps {
  onSuccess?: () => void;
}

const fieldClass =
  "focus-visible:ring-brand rounded-md border border-gray-300 px-3 py-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

export function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
  });

  const submit = async (data: LoginInput) => {
    try {
      await auth.login(data.email, data.password);
      onSuccess?.();
    } catch (err) {
      setError("root.serverError", {
        message: err instanceof Error ? err.message : "Login failed",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="rounded-card bg-surface p-card mx-auto w-full max-w-sm shadow-md"
    >
      <h2 className="text-brand mb-6 text-2xl font-semibold">Sign In</h2>

      {errors.root?.serverError && (
        <p
          role="alert"
          className="text-danger mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
        >
          {errors.root.serverError.message}
        </p>
      )}

      <div className="mb-4 flex flex-col gap-1">
        <label
          htmlFor="login-email"
          className="text-text-muted text-sm font-medium"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className={fieldClass}
          {...register("email")}
        />
        {errors.email && (
          <p id="login-email-error" role="alert" className="text-danger text-xs">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <label
          htmlFor="login-password"
          className="text-text-muted text-sm font-medium"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={
            errors.password ? "login-password-error" : undefined
          }
          className={fieldClass}
          {...register("password")}
        />
        {errors.password && (
          <p
            id="login-password-error"
            role="alert"
            className="text-danger text-xs"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={clsx(
          "w-full rounded-md px-4 py-2 font-medium text-white transition-colors",
          "focus-visible:ring-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          isSubmitting
            ? "bg-brand/40 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        {isSubmitting ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
