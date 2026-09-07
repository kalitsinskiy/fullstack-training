import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const registerSchema = LoginSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, 'At least 2 characters')
    .max(50, 'At most 50 characters'),
  password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
