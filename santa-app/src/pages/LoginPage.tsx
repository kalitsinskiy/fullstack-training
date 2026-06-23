import { useLocation, useNavigate, Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where the user was heading before being bounced — fall back to /rooms
  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? "/rooms";

  // If already logged in (e.g. they clicked /login by mistake), bounce to destination
  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  return (
    <div className="bg-bg-base flex min-h-screen items-center justify-center">
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </div>
  );
}
