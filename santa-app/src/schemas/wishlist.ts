import { z } from 'zod';

export const wishlistFormSchema = z.object({
  items: z.array(
    z.object({
      value: z.string().trim().max(100, 'Keep it under 100 characters'),
    }),
  ),
});

export type WishlistFormInput = z.infer<typeof wishlistFormSchema>;
