import type { FallbackProps } from "react-error-boundary";

export default function WishlistErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-700">Wishlist error</p>
      <p className="mt-0.5 text-xs text-red-600">
        {error instanceof Error ? error.message : "Failed to load wishlist."}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-2 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}
