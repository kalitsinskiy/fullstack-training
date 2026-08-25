import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/** Gate for protected routes. Redirects to /login when unauthenticated. */
export function AuthGuard() {
  const { isAuthenticated, isLoading, authError, retryLoadProfile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  // A network/5xx failure, not an invalid session — the token is intact, so
  // offer a retry instead of bouncing to /login and losing the session.
  if (authError && !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
        <p>Couldn&apos;t reach the server. Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => void retryLoadProfile()}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
