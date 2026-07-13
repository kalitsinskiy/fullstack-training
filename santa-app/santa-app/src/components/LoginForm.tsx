import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { LoginSchema, type LoginInput } from "@/schemas/auth";

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const auth = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
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
      className="rounded-card p-card bg-surface w-full max-w-sm shadow-md"
    >
      {errors.root?.serverError && (
        <p
          role="alert"
          className="text-danger mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
        >
          {errors.root.serverError.message}
        </p>
      )}

      <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <legend className="text-brand px-2 font-semibold">Sign in</legend>

        <FormField
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <FormField
          label="Password"
          type="password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register("password")}
        />
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="mt-4 w-full">
        {isSubmitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
