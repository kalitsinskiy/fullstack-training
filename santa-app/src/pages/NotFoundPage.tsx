import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-700">404 — Page not found</h1>
      <Link to="/rooms" className="text-sm text-blue-600 hover:underline">
        Go to Rooms
      </Link>
    </div>
  );
}
