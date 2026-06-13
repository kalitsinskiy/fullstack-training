import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import RoomList from "./components/RoomList";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-brand text-3xl font-bold">Secret Santa App</h1>
        {auth.isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{auth.user?.email}</span>
            <button
              onClick={auth.logout}
              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Auth forms */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Auth</h2>
        <div className="flex flex-wrap gap-6">
          <LoginForm />
          <RegisterForm />
        </div>
      </section>

      {/* Room list */}
      <RoomList />
    </div>
  );
}

export default App;
