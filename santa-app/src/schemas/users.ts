import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'At least 2 characters')
    .max(50, 'At most 50 characters'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
