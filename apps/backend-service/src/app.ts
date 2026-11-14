/**
 * Fastify App Configuration — Diccionario Misak
 * Configuración de plugins HTTP, seguridad, cookies, carga multimedia y rutas API
 */

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import type { FastifyError, FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { TokenService } from './infrastructure/auth/TokenService.js';
import { corsOrigins, env, isDevelopment, logConfig } from './shared/config/env.js';
import { createRateLimitPluginOptions } from './shared/http/rateLimitPolicy.js';

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
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        mediaSrc: ["'self'", 'blob:', 'data:', 'https:'],
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 horas
  });

  /**
   * Plugin: Cookie
   * Soporte para cookies HttpOnly de sesión administrativa (Spec 006, ADR-0004)
   */
  await app.register(cookie);

  /**
   * Parser JSON tolerante a cuerpos vacíos (Spec 008 R-001)
   * Evita que peticiones POST/DELETE sin body (ej. /auth/refresh o /auth/logout con cookie
   * httpOnly) fallen con 400 FST_ERR_CTP_EMPTY_JSON_BODY cuando el cliente envía
   * Content-Type: application/json con cuerpo vacío.
   */
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (!body || (typeof body === 'string' && body.trim() === '')) {
      done(null, undefined);
      return;
    }
    try {
      const parsed = JSON.parse(body as string);
      done(null, parsed);
    } catch (err) {
      const syntaxErr = err as FastifyError;
      syntaxErr.statusCode = 400;
      done(syntaxErr, undefined);
    }
  });

  /**
   * Plugin: Multipart
   * Subida segura de medios culturales con límites de tamaño y archivos (Spec 007, R-005)
   */
  await app.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100 MB máx por archivo (soporte video, Spec 007)
      files: 1,
      fields: 25,
    },
    attachFieldsToBody: false,
  });

  /**
   * Plugin: Rate Limiting
   * Protección contra ataques de fuerza bruta
   */
  const rateLimitTokenService = new TokenService();
  await app.register(
    rateLimit,
    createRateLimitPluginOptions(
      {
        globalMax: env.RATE_LIMIT_MAX,
        globalWindow: env.RATE_LIMIT_TIMEWINDOW,
        publicMax: env.PUBLIC_RATE_LIMIT_MAX,
        publicWindow: env.PUBLIC_RATE_LIMIT_WINDOW,
        adminMax: env.ADMIN_RATE_LIMIT_MAX,
        adminWindow: env.ADMIN_RATE_LIMIT_WINDOW,
        streamMax: env.STREAM_RATE_LIMIT_MAX,
        streamWindow: env.STREAM_RATE_LIMIT_WINDOW,
      },
      rateLimitTokenService,
    ),
  );

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
      name: 'Diccionario Misak - Backend API',
      version: '0.5.0-alpha.0',
      health: '/health',
      endpoints: {
        auth: '/auth',
        dictionary: '/api/dictionary',
        media: '/api/media',
        admin: '/api/admin',
      },
    };
  });

  /**
   * Auth Routes
   */
  const { authRoutes } = await import('./presentation/routes/authRoutes.js');
  await app.register(authRoutes);

  /**
   * Dictionary Routes (Public API)
   */
  const { dictionaryRoutes } = await import('./api/dictionary/routes/dictionaryRoutes.js');
  await app.register(dictionaryRoutes, { prefix: '/api/dictionary' });

  /**
   * Media Routes (Public Streaming & Metadata, Spec 007)
   */
  const { mediaRoutes } = await import('./presentation/routes/mediaRoutes.js');
  await app.register(mediaRoutes, { prefix: '/api/media' });

  /**
   * Admin Sentidos Routes (Protected API — CRUD y ratificación editorial, Spec 006)
   */
  const { adminSentidoRoutes } = await import('./api/admin/routes/adminSentidoRoutes.js');
  await app.register(adminSentidoRoutes, {
    prefix: '/api/admin/dictionary/sentidos',
  });

  /**
   * Admin Abreviaturas Routes (Protected API — Catálogo y CRUD dinámico, Spec 012 v0.2.0)
   */
  const { adminAbreviaturaRoutes } = await import('./api/admin/routes/adminAbreviaturaRoutes.js');
  await app.register(adminAbreviaturaRoutes, {
    prefix: '/api/admin/dictionary/abreviaturas',
  });

  /**
   * Admin Taxonomy Routes (Protected API — Gestión y protección jerárquica 409, Spec 012 v0.2.0)
   */
  const { adminTaxonomyRoutes } = await import('./api/admin/routes/adminTaxonomyRoutes.js');
  await app.register(adminTaxonomyRoutes, {
    prefix: '/api/admin/dictionary/taxonomia',
  });

  /**
   * Admin Governance Routes (Protected API — Nodos, lote y progreso, Spec 006)
   */
  const { adminGovernanceRoutes } = await import('./api/admin/routes/adminGovernanceRoutes.js');
  await app.register(adminGovernanceRoutes, {
    prefix: '/api/admin/governance',
  });

  /**
   * Admin Papelera Routes (Protected API — Papelera y purga, Spec 006)
   */
  const { adminPapeleraRoutes } = await import('./api/admin/routes/adminPapeleraRoutes.js');
  await app.register(adminPapeleraRoutes, {
    prefix: '/api/admin/papelera',
  });

  /**
   * Admin User Routes (Protected API — super_admin, espec 002 R-007, Spec 006 R-018)
   */
  const { adminUserRoutes } = await import('./api/admin/routes/adminUserRoutes.js');
  await app.register(adminUserRoutes);

  /**
   * Admin Audit Routes (Protected API — bitácora de auditoría, Spec 006 R-019)
   */
  const { adminAuditRoutes } = await import('./api/admin/routes/adminAuditRoutes.js');
  await app.register(adminAuditRoutes, {
    prefix: '/api/admin/audit',
  });

  /**
   * Admin Settings Routes (Protected API — configuración del sistema, Spec 006 R-026)
   */
  const { adminSettingsRoutes } = await import('./api/admin/routes/adminSettingsRoutes.js');
  await app.register(adminSettingsRoutes, {
    prefix: '/api/admin/settings',
  });

  /**
   * Admin Media Routes (Protected API — medios escalonados, Spec 007 R-007, R-014)
   */
  const { adminMediaRoutes } = await import('./api/admin/routes/adminMediaRoutes.js');
  await app.register(adminMediaRoutes, {
    prefix: '/api/admin/medios',
  });

  /**
   * Cabecera Cache-Control: no-store en rutas autenticadas y administrativas (R-024)
   * Previene almacenamiento en cachés intermedias, proxies o historial de navegación.
   */
  app.addHook('onSend', async (request, reply) => {
    if (request.url.startsWith('/api/admin') || request.url.startsWith('/auth')) {
      reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
    }
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
  app.setErrorHandler((error: FastifyError, request, reply) => {
    // Log error
    request.log.error(error);

    // Error de validación
    if (error.validation) {
      return reply.code(400).send({
        statusCode: 400,
        error: 'Validation Error',
        code: 'VALIDATION_ERROR',
        message: error.message,
        validation: error.validation,
      });
    }

    // Error de conexión con base de datos (Prisma P1001/P1002/InitializationError)
    // biome-ignore lint/suspicious/noExplicitAny: extracción defensiva de código de error Prisma/Fastify
    const errorCode = (error as any).code;
    if (
      error.name === 'PrismaClientInitializationError' ||
      errorCode === 'P1001' ||
      errorCode === 'P1002'
    ) {
      return reply.code(503).send({
        statusCode: 503,
        error: 'Service Unavailable',
        code: 'SERVICE_UNAVAILABLE',
        message:
          'No es posible conectar con la base de datos del sistema. Intente de nuevo en unos minutos.',
      });
    }

    // Error HTTP del plugin sensible o AppError con código tipado
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        code: errorCode ?? (error.statusCode === 429 ? 'RATE_LIMITED' : error.name),
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
