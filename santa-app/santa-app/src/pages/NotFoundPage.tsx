import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-gray-500">Page not found.</p>
      <Link to="/rooms" className="text-brand underline">
        Go to Rooms
      </Link>
    </main>
  );
}
