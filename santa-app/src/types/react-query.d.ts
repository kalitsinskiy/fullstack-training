import '@tanstack/react-query';

declare module '@tanstack/react-query' {
  /**
   * Types `mutation.meta`, which the MutationCache `onError` in
   * `lib/queryClient.ts` reads to decide what to show the user.
   *
   * - `errorMessage` — fallback text when the API gives no `message`.
   * - `silentError`  — opt out of the toast entirely, for background mutations
   *   (mark-as-read) where a failure isn't worth interrupting anyone.
   */
  interface Register {
    mutationMeta: {
      errorMessage?: string;
      silentError?: boolean;
    };
  }
}
