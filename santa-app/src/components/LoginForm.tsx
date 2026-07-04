import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { LoginSchema, type LoginInput } from "../schemas/auth";
import { FormField } from "./FormField";

export default function LoginForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? "/rooms";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
  });

  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  const submit = async (data: LoginInput) => {
    try {
      await auth.login(data.email, data.password);
      navigate(from, { replace: true });
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
      aria-label="login form"
      className="flex w-80 flex-col gap-3 rounded-lg bg-(--surface) p-4 shadow"
    >
      <h3 className="text-lg font-semibold text-(--text)">Login</h3>

      {errors.root?.serverError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.root.serverError.message}
        </div>
      )}

      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        disabled={isSubmitting}
        error={errors.email?.message}
        {...register("email")}
      />

      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register("password")}
      />

      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand hover:bg-brand-dark mt-2 h-10 font-semibold text-(--button-text)"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
