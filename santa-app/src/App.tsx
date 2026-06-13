import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import RoomList from "./components/RoomList";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-brand mb-8 text-3xl font-bold">Secret Santa App</h1>

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
