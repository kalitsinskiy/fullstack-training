import axios from 'axios';
import { createApiClient } from './create-api-client';

export { tokenStore } from './token-store';

export const api = createApiClient(import.meta.env.VITE_API_URL);

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (data?.message) return data.message;
  }
  return fallback;
}
