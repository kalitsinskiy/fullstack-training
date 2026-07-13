import type { FallbackProps } from "react-error-boundary";
import { ApiError, getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/button";

function describe(error: unknown): string {
  // ApiErrors get the app's user-facing categorized message; anything else
  // (a plain render-time throw, a bug) shows its raw message for debuggability.
  if (error instanceof ApiError) return getErrorMessage(error);
  if (error instanceof Error) return error.message;
  return getErrorMessage(error);
}

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4">
      <p className="text-danger font-semibold">Something went wrong.</p>
      <p className="mt-1 text-sm text-red-700">{describe(error)}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}
