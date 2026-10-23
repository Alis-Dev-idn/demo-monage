import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
    agree: z.boolean().refine((v) => v === true, 'Harus menyetujui syarat'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

export const forgotSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export const resetSchema = z
  .object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotFormData = z.infer<typeof forgotSchema>;
export type ResetFormData = z.infer<typeof resetSchema>;
