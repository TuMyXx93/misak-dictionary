/**
 * App Configuration Tests (T-027, R-024)
 * Verifica que buildApp() registra correctamente las rutas y añade la cabecera
 * Cache-Control: no-store en rutas administrativas y de autenticación.
 */

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { authRateLimitKey } from './presentation/routes/authRoutes.js';

describe('Fastify buildApp configuration (T-027)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('el endpoint /health responde 200 y no tiene no-store obligatorio', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ok');
  });

  it('las rutas de /auth inyectan Cache-Control: no-store (R-024)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });

    // Aunque retorne 401 por falta de token, la respuesta debe tener Cache-Control: no-store
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('las rutas de /api/admin inyectan Cache-Control: no-store (R-024)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/dictionary/progreso',
    });

    // Aunque retorne 401 por falta de token, la respuesta debe tener Cache-Control: no-store
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('las rutas no administrativas públicas (ej. /health o /) no inyectan Cache-Control: no-store', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control'] ?? '').not.toContain('no-store');
  });

  it('POST /auth/refresh con Content-Type: application/json y body vacío no falla con 400 FST_ERR_CTP_EMPTY_JSON_BODY (Spec 008 R-001)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: {
        'content-type': 'application/json',
        'x-client': 'web-admin',
      },
      payload: '',
    });

    // Sin cookie misak_rt debe responder 401 del controlador, nunca 400 del parser JSON
    expect(res.statusCode).toBe(401);
  });

  it('authRateLimitKey genera claves aisladas por IP e identificador normalizado (username o email)', () => {
    const keyUserA = authRateLimitKey({
      ip: '127.0.0.1',
      body: { username: 'Admin@Misak.Local' },
    });
    const keyUserB = authRateLimitKey({
      ip: '127.0.0.1',
      body: { username: 'test.uno' },
    });
    const keyUserC = authRateLimitKey({
      ip: '127.0.0.1',
      body: { email: 'test2@misak.com' },
    });

    expect(keyUserA).toBe('127.0.0.1:admin@misak.local');
    expect(keyUserB).toBe('127.0.0.1:test.uno');
    expect(keyUserC).toBe('127.0.0.1:test2@misak.com');
    expect(keyUserA).not.toBe(keyUserB);
    expect(keyUserB).not.toBe(keyUserC);
  });
});
