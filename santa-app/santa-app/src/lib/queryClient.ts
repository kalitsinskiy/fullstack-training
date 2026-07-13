import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api';

// 404/409 are expected, app-level states here (e.g. "no wishlist yet",
// "assignment not drawn") that components already branch on inline —
// don't let those reach an ErrorBoundary. Anything else (5xx, network
// failures, bugs) is a real crash and should be promoted to the boundary.
function isExpectedStatus(error: unknown) {
  return error instanceof ApiError && (error.status === 404 || error.status === 409);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      throwOnError: (error) => !isExpectedStatus(error),
    },
  },
});
