import { z } from 'zod';

export const ExchangeSchema = z.object({
  exchangeDate: z
    .string()
    .min(1, 'Pick a date & time')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Invalid date & time'),
  exchangePlace: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
});

export type ExchangeInput = z.infer<typeof ExchangeSchema>;
