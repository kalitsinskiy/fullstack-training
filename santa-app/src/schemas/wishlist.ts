import { z } from "zod";

export const WishlistSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Required"),
        url: z.string().url("Invalid URL").optional().or(z.literal("")),
        priority: z.coerce.number().int().min(1).max(5).optional(),
      }),
    )
    .min(1, "Add at least one item"),
});
export type WishlistInput = z.infer<typeof WishlistSchema>;
