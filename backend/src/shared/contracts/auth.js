import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required').max(100),
    password: z.string().min(1, 'Password is required').max(255),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
  }),
});

export const meResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    fullName: z.string(),
    role: z.enum(['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'DEPARTMENT_HEAD', 'AUDITOR', 'VIEWER']),
    externalId: z.string().nullable(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});