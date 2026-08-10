import { createApiClient } from './create-api-client';

export const notificationsApi = createApiClient(import.meta.env.VITE_WS_URL);
