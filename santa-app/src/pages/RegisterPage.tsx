import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.isAuthenticated) return <Navigate to="/rooms" replace />;

  return (
    <div className="bg-bg-base flex min-h-screen items-center justify-center">
      <RegisterForm onSuccess={() => navigate("/login")} />
    </div>
  );
}
