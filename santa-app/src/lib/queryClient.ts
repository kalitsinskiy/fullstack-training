import {
  MutationCache,
  QueryClient,
  type DefaultOptions,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from './api';

export function createQueryClient(
  queryOverrides: DefaultOptions['queries'] = {},
): QueryClient {
  return new QueryClient({
    /**
     * One place to surface mutation failures.
     *
     * Toasting is the DEFAULT: a silent failure is the worse bug, so a new
     * mutation that forgets `meta` still tells the user something went wrong.
     * Background mutations opt out with `meta.silentError`.
     */
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (mutation.meta?.silentError) return;

        toast.error(getApiErrorMessage(error, mutation.meta?.errorMessage));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
        ...queryOverrides,
      },
    },
  });
}

export const queryClient = createQueryClient();
