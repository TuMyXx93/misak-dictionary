/**
 * Fastify App Configuration
 * Week 3 - Backend Service
 * Setup de Fastify con plugins de seguridad, CORS, rate limiting
 */

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { env, corsOrigins, logConfig, isDevelopment } from './shared/config/env.js';

/**
 * Crear y configurar aplicación Fastify
 */
export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: logConfig,
    trustProxy: true,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: !isDevelopment,
  });

  /**
   * Plugin: Sensible
   * Añade utilidades HTTP sensatas (httpErrors, assert, etc.)
   */
  await app.register(sensible);

  /**
   * Plugin: Helmet
   * Headers de seguridad HTTP
   */
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  /**
   * Plugin: CORS
   * Cross-Origin Resource Sharing
   */
  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 horas
  });

  /**
   * Plugin: Rate Limiting
   * Protección contra ataques de fuerza bruta
   */
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIMEWINDOW,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  });

  /**
   * Health Check Endpoint
   */
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    };
  });

  /**
   * Root Endpoint
   */
  app.get('/', async () => {
    return {
      name: 'Diccionario Cultural Misak - Backend API',
      version: '0.3.0',
      documentation: '/docs',
      health: '/health',
    };
  });

  /**
   * 404 Handler
   */
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  /**
   * Error Handler Global
   */
  app.setErrorHandler((error, request, reply) => {
    // Log error
    request.log.error(error);

    // Error de validación
    if (error.validation) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: error.message,
        validation: error.validation,
      });
    }

    // Error HTTP del plugin sensible
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    // Error genérico del servidor
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
    });
  });

  /**
   * Graceful Shutdown Hook
   */
  app.addHook('onClose', async () => {
    app.log.info('Shutting down gracefully...');
  });

  return app;
};
