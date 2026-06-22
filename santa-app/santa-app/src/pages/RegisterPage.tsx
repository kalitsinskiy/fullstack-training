import { Navigate, useNavigate } from "react-router";
import { RegisterForm } from "../components/RegisterForm";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.isAuthenticated) return <Navigate to="/rooms" replace />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <RegisterForm onSuccess={() => navigate("/rooms", { replace: true })} />
      <p className="text-sm text-gray-500">
        Already have an account?{" "}
        <a href="/login" className="text-brand underline">
          Sign in
        </a>
      </p>
    </main>
  );
}
