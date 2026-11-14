/**
 * Server Entry Point — Diccionario Misak
 * Inicialización del servidor Fastify, conexión a PostgreSQL y apagado ordenado
 */

import { buildApp } from './app.js';
import { RootBootstrapService } from './application/use-cases/auth/RootBootstrapService.js';
import { APP_VERSION, env } from './shared/config/env.js';
import { connectDatabase, disconnectDatabase } from './shared/config/prisma.js';

/**
 * Función principal de inicio del servidor
 */
const start = async (): Promise<void> => {
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;

  try {
    // Construir aplicación Fastify para disponer de logger estructurado desde el arranque
    app = await buildApp();

    // Intentar conectar a la base de datos (opcional para testing)
    try {
      await connectDatabase();
    } catch {
      app.log.warn('Database connection failed. Running in NO-DB mode for testing.');
    }

    // Spec 002 R-008: bootstrap del usuario root (idempotente, no-op sin env)
    try {
      const bootstrapped = await new RootBootstrapService().ensureRootExists();
      if (bootstrapped) {
        app.log.info('Usuario root inicial creado. Cambia la contraseña tras el primer login.');
      }
    } catch (error) {
      app.log.error({ err: error }, 'Error en bootstrap de root');
    }

    // Iniciar servidor
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(
      { version: APP_VERSION, env: env.NODE_ENV, host: env.HOST, port: env.PORT },
      'Diccionario Misak — Backend API running',
    );
  } catch (error) {
    if (app) {
      app.log.error({ err: error }, 'Failed to start server');
    } else {
      console.error('❌ Failed to start server:', error);
    }
    process.exit(1);
  }

  /**
   * Graceful Shutdown
   * Manejar señales de terminación (SIGINT, SIGTERM)
   */
  const gracefulShutdown = async (signal: string) => {
    app?.log.info({ signal }, 'Received shutdown signal, shutting down gracefully...');

    try {
      // Cerrar servidor Fastify
      if (app) {
        await app.close();
      }

      // Desconectar de la base de datos
      await disconnectDatabase();

      app?.log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      if (app) {
        app.log.error({ err: error }, 'Error during shutdown');
      } else {
        console.error('❌ Error during shutdown:', error);
      }
      process.exit(1);
    }
  };

  // Escuchar señales de terminación
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Capturar errores no manejados
  process.on('unhandledRejection', (reason, promise) => {
    if (app) {
      app.log.error({ err: reason, promise }, 'Unhandled Rejection');
    } else {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    }
    // En producción, podrías querer cerrar el proceso
    if (env.NODE_ENV === 'production') {
      gracefulShutdown('unhandledRejection');
    }
  });

  process.on('uncaughtException', (error) => {
    if (app) {
      app.log.error({ err: error }, 'Uncaught Exception');
    } else {
      console.error('❌ Uncaught Exception:', error);
    }
    // Siempre cerrar en caso de excepción no capturada
    gracefulShutdown('uncaughtException');
  });
};

// Iniciar servidor
start();
