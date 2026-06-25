import type { FallbackProps } from "react-error-boundary";
import { useLocation } from "react-router";

export default function RouteFallback({ error, resetErrorBoundary }: FallbackProps) {
  const location = useLocation();

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-700">Page error</h2>
      <p className="mt-1 text-sm text-red-600">
        {error instanceof Error ? error.message : "Something went wrong on this page."}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-3 rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        key={location.pathname}
      >
        Retry
      </button>
    </div>
  );
}
