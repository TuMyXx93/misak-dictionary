/**
 * Environment Configuration
 * Week 3 - Backend Service
 * Validación de variables de entorno con Zod
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Schema de validación para variables de entorno
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(8).max(15)).default('10'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1)).default('100'),
  RATE_LIMIT_TIMEWINDOW: z.string().default('15m'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Media Upload (optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number()).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),
  REDIS_TTL: z.string().transform(Number).pipe(z.number()).optional(),

  // Admin seed
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_FULL_NAME: z.string().optional(),
});

/**
 * Tipo inferido del schema de entorno
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validar y parsear variables de entorno
 */
const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Error validando variables de entorno:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
};

/**
 * Variables de entorno validadas y tipadas
 */
export const env = parseEnv();

/**
 * Helper para verificar si estamos en producción
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper para verificar si estamos en desarrollo
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper para verificar si estamos en test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Configuración de CORS origins como array
 */
export const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

/**
 * Logging configuration object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logConfig: any = isDevelopment
  ? {
      level: env.LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }
  : {
      level: env.LOG_LEVEL,
    };
