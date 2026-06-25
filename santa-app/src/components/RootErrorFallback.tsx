import type { FallbackProps } from "react-error-boundary";
import Button from "@mui/material/Button";

export default function RootErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-red-700">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-gray-600">
        {error instanceof Error ? error.message : "An unexpected error occurred."}
      </p>
      <Button variant="contained" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}
