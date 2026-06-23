import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="bg-bg-base flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-text-base text-5xl font-bold">404</h1>
      <p className="text-text-muted text-lg">Page not found.</p>
      <Link to="/rooms" className="text-brand hover:underline">
        Go to Rooms
      </Link>
    </div>
  );
}
