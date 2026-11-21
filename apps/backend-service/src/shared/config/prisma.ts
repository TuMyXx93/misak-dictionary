/**
 * Prisma Client Configuration
 * Prisma 7 - Backend Service
 * Singleton pattern para conexión a base de datos
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { env, isDevelopment } from './env.js';

/**
 * Singleton de PrismaClient
 * Evita múltiples instancias y memory leaks en desarrollo con hot reload
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Crear adapter para PostgreSQL
 */
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 15,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

/**
 * Configuración de Prisma Client (Prisma 7)
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

// En desarrollo, guardar instancia global para hot reload
if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}

/**
 * Conectar a la base de datos
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

/**
 * Desconectar de la base de datos
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
};
