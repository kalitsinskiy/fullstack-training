import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-3xl border border-(--border) bg-(--surface) p-8 text-center shadow">
      <p className="text-xs tracking-[0.24em] text-(--muted) uppercase">404</p>
      <h2 className="text-3xl font-semibold text-(--text)">Page not found</h2>
      <p className="text-sm text-(--muted)">
        This route does not exist. Return to rooms to keep going.
      </p>
      <div>
        <Link
          to="/rooms"
          className="bg-brand hover:bg-brand-dark inline-flex rounded-full px-4 py-2 text-sm font-semibold text-(--button-text) transition"
        >
          Go to rooms
        </Link>
      </div>
    </section>
  );
}
