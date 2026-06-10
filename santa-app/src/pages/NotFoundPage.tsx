import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="grid flex-1 place-items-center text-center">
      <div>
        <p className="text-muted mb-4 text-6xl font-bold">404</p>
        <p className="text-fg mb-6">Ooops, page not found.</p>
        <Link to="/rooms" className="text-brand hover:text-brand-dark font-semibold">
          Go to Rooms
        </Link>
      </div>
    </main>
  );
}
