import { type FallbackProps } from 'react-error-boundary';
import { Button } from './ui/button';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
    >
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          Something unexpected happened. Please try again.
        </p>
        {import.meta.env.DEV && error instanceof Error && (
          <p className="max-w-md text-xs text-muted-foreground/70">
            {error.message}
          </p>
        )}
      </div>
      <Button variant="outline" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}
