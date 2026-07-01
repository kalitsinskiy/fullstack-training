import type { FallbackProps } from "react-error-boundary";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4"
    >
      <p className="text-danger font-semibold">Something went wrong.</p>
      <pre className="text-danger mt-1 text-xs whitespace-pre-wrap">
        {error instanceof Error ? error.message : String(error)}
      </pre>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="bg-brand hover:bg-brand-dark mt-3 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
