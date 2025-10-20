/**
 * Server Entry Point
 * Week 3 - Backend Service
 * Inicialización del servidor Fastify y conexión a la base de datos
 */

import { buildApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './shared/config/prisma.js';
import { env } from './shared/config/env.js';

/**
 * Función principal de inicio del servidor
 */
const start = async (): Promise<void> => {
  let app;

  try {
    // Intentar conectar a la base de datos (opcional para testing)
    try {
      await connectDatabase();
    } catch {
      console.warn('⚠️  WARNING: Database connection failed. Running in NO-DB mode for testing.');
      console.warn('   Fix this by configuring PostgreSQL and setting DATABASE_URL correctly.');
    }

    // Construir aplicación Fastify
    app = await buildApp();

    // Iniciar servidor
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`
╔═══════════════════════════════════════════════════╗
║  🎭 Diccionario Cultural Misak - Backend API      ║
║  📌 Version: 0.3.0                                ║
║  🌐 Environment: ${env.NODE_ENV.padEnd(31)}║
║  🚀 Server: http://${env.HOST}:${env.PORT.toString().padEnd(25)}║
║  💚 Health: http://${env.HOST}:${env.PORT}/health${' '.repeat(16)}║
║  📊 Status: Running                               ║
╚═══════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  /**
   * Graceful Shutdown
   * Manejar señales de terminación (SIGINT, SIGTERM)
   */
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);

    try {
      // Cerrar servidor Fastify
      if (app) {
        await app.close();
        console.log('✅ Server closed');
      }

      // Desconectar de la base de datos
      await disconnectDatabase();

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Escuchar señales de terminación
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Capturar errores no manejados
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // En producción, podrías querer cerrar el proceso
    if (env.NODE_ENV === 'production') {
      gracefulShutdown('unhandledRejection');
    }
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Siempre cerrar en caso de excepción no capturada
    gracefulShutdown('uncaughtException');
  });
};

// Iniciar servidor
start();
