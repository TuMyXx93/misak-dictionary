/**
 * Environment Configuration
 * Diccionario Misak — Backend Service
 * Validación de variables de entorno con Zod
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
dotenv.config();

/**
 * Schema de validación para variables de entorno
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number).pipe(z.number().min(1).max(65535)),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security — Argon2id (Spec 002) defaults alineados a OWASP Password Storage
  ARGON2_MEMORY_KIB: z.string().default('65536').transform(Number).pipe(z.number().min(19456)),
  ARGON2_TIME_COST: z.string().default('3').transform(Number).pipe(z.number().min(2)),
  ARGON2_PARALLELISM: z.string().default('4').transform(Number).pipe(z.number().min(1)),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number).pipe(z.number().min(1)),
  RATE_LIMIT_TIMEWINDOW: z.string().default('15m'),
  // Rate limiting específico de auth (Spec 002 R-003)
  AUTH_RATE_LIMIT_MAX: z.string().default('5').transform(Number).pipe(z.number().min(1)),
  AUTH_RATE_LIMIT_WINDOW: z.string().default('15m'),

  // Root bootstrap (Spec 002 R-008) — opcional, solo primer arranque.
  // Docker Compose pasa variables no definidas como string vacío:
  // se normalizan a undefined para que .optional() aplique.
  ROOT_BOOTSTRAP_EMAIL: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().email().optional(),
  ),
  ROOT_BOOTSTRAP_PASSWORD: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(12).optional(),
  ),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Seed admin (opcional para prisma/seed.ts; mínimo 15 caracteres)
  SEED_ADMIN_PASSWORD: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(15).optional(),
  ),
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
