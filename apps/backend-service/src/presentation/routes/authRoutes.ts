/**
 * Auth Routes
 * Sprint 2 - Auth System
 * Rutas de autenticación para Fastify
 */

import type { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Prefijo para todas las rutas de auth
  app.register(
    async (authApp) => {
      /**
       * POST /auth/login
       * Autenticar usuario y obtener tokens
       */
      authApp.post('/login', AuthController.login);

      /**
       * POST /auth/refresh
       * Renovar access token
       */
      authApp.post('/refresh', AuthController.refresh);

      /**
       * POST /auth/logout
       * Cerrar sesión
       */
      authApp.post('/logout', AuthController.logout);
    },
    { prefix: '/auth' },
  );
}
