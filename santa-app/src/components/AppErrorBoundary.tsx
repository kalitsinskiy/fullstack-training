import { ErrorBoundary } from 'react-error-boundary';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

function logRenderError(error: unknown, info: ErrorInfo): void {
  console.error('[ErrorBoundary]', error, info.componentStack);
}

export function AppErrorBoundary({
  children,
  resetKeys,
}: {
  children: ReactNode;
  resetKeys?: unknown[];
}) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logRenderError}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  );
}
