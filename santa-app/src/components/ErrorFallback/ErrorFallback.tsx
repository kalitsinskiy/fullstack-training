import type { FallbackProps } from 'react-error-boundary';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <Alert variant="destructive">
        <AlertTitle>Something went wrong.</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Unexpected error'}
        </AlertDescription>
      </Alert>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}
