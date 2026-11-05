import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email address format').max(255),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export const GoogleAuthRequestSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required')
});

export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;
export type GoogleAuthRequestDto = z.infer<typeof GoogleAuthRequestSchema>;
