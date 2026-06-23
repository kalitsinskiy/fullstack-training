import clsx from "clsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../contexts/AuthContext";
import { LoginSchema, type LoginInput } from "../schemas/auth";

interface Props {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
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
      className="rounded-card p-card flex w-full max-w-sm flex-col gap-4 bg-white shadow-sm"
      noValidate
    >
      <h2 className="text-brand text-xl font-semibold">Sign In</h2>

      {errors.root?.serverError && (
        <p
          className="rounded bg-red-50 px-3 py-2 text-sm text-red-600"
          role="alert"
        >
          {errors.root.serverError.message}
        </p>
      )}

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
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p id="login-email-error" className="text-xs text-red-500" role="alert">
            {errors.email.message}
          </p>
        )}
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
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p id="login-password-error" className="text-xs text-red-500" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={clsx(
          "rounded px-4 py-2 text-sm font-medium text-white transition-colors",
          isSubmitting
            ? "bg-brand/50 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark",
        )}
      >
        {isSubmitting ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
