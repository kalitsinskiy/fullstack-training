import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import RegisterForm from "../components/RegisterForm";

export default function RegisterPage() {
  const auth = useAuth();

  if (auth.isAuthenticated) return <Navigate to="/rooms" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <RegisterForm />
    </div>
  );
}
