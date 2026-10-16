/**
 * App Configuration Tests (T-027, R-024)
 * Verifica que buildApp() registra correctamente las rutas y añade la cabecera
 * Cache-Control: no-store en rutas administrativas y de autenticación.
 */

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

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
});
