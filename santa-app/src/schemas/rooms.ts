import { z } from 'zod';

export const CURRENCIES = ['$', '€', '£', '₴', 'zł'] as const;

export type Currency = (typeof CURRENCIES)[number];

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .max(60, 'At most 60 characters'),
  budget: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a number' })
      .int('Whole number only')
      .min(1, 'Min 1')
      .max(1_000_000, 'Too large')
      .optional(),
  ),
  currency: z.enum(CURRENCIES).optional(),
});

export type CreateRoomFormInput = z.infer<typeof createRoomSchema>;

export const editRoomSchema = createRoomSchema.extend({
  exchangeDate: z.date().optional(),
});

export type EditRoomFormInput = z.infer<typeof editRoomSchema>;

export const joinRoomSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{6}$/, 'Enter the 6-character code'),
});

export type JoinRoomFormInput = z.infer<typeof joinRoomSchema>;
