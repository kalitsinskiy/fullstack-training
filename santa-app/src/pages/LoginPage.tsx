import { useLocation, useNavigate, Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: { pathname?: string } } | null;
  const from = state?.from?.pathname ?? "/rooms";

  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </div>
  );
}
