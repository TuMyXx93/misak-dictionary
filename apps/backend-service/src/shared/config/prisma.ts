/**
 * Prisma Client Configuration
 * Week 3 - Backend Service
 * Singleton pattern para conexión a base de datos
 */

import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from './env.js';

/**
 * Singleton de PrismaClient
 * Evita múltiples instancias y memory leaks en desarrollo con hot reload
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Configuración de Prisma Client
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
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
    console.log('✅ Database connected successfully');
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
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
};

/**
 * Health check de la base de datos
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};
