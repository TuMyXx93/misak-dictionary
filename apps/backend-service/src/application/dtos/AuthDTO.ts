/**
 * Auth DTOs with Zod Validation
 * Sprint 2 - Auth System
 * Data Transfer Objects con validación de entrada
 */

import { z } from 'zod';

/**
 * Login Request DTO
 */
export const LoginDTOSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
});

export type LoginDTO = z.infer<typeof LoginDTOSchema>;

/**
 * Refresh Token Request DTO
 */
export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTOSchema>;

/**
 * Logout Request DTO
 */
export const LogoutDTOSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LogoutDTO = z.infer<typeof LogoutDTOSchema>;

/**
 * Auth Response DTO
 */
export const AuthResponseDTOSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().email(),
    fullName: z.string(),
    roles: z.array(z.string()),
  }),
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  }),
});

export type AuthResponseDTO = z.infer<typeof AuthResponseDTOSchema>;
