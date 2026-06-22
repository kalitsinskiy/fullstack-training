import { Navigate, useLocation, useNavigate } from "react-router";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? "/rooms";

  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
      <p className="text-sm text-gray-500">
        No account?{" "}
        <a href="/register" className="text-brand underline">
          Register
        </a>
      </p>
    </main>
  );
}
