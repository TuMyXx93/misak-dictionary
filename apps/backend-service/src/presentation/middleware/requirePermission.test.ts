/**
 * @module requirePermission.test
 * @description Verifica que requirePermission permita o deniegue según los
 * permisos efectivos del usuario (resueltos en servidor, no desde el JWT).
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PERMISSIONS, ROLE_CATALOG } from '../../shared/auth/permissions.js';
import {
  requireAnyPermission,
  requirePasswordChanged,
  requirePermission,
} from './authorizationMiddleware.js';

let currentUser: { userId: bigint; username: string; roles: string[] } | undefined;
let permisosEnBD: string[] = [];

describe('requirePermission', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    currentUser = undefined;
    permisosEnBD = [];

    app = Fastify({ logger: false });
    app.addHook('preHandler', async (request) => {
      if (currentUser !== undefined) {
        // biome-ignore lint/suspicious/noExplicitAny: simula authMiddleware
        (request as any).user = currentUser;
      }
    });

    app.get(
      '/diccionario',
      {
        preHandler: requirePermission(PERMISSIONS.DICCIONARIO_ESCRIBIR, async () => permisosEnBD),
      },
      async () => ({ ok: true }),
    );

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve 401 cuando no hay usuario autenticado', async () => {
    const response = await app.inject({ method: 'GET', url: '/diccionario' });

    expect(response.statusCode).toBe(401);
  });

  it('devuelve 403 cuando el usuario no tiene el permiso', async () => {
    currentUser = {
      userId: 2n,
      username: 'lector',
      roles: ['analytics_viewer'],
    };
    permisosEnBD = [];

    const response = await app.inject({ method: 'GET', url: '/diccionario' });

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body).error).toBe('Forbidden');
  });

  it('permite el acceso cuando la base reporta el permiso', async () => {
    currentUser = {
      userId: 3n,
      username: 'moderador',
      roles: ['content_admin'],
    };
    permisosEnBD = ['dictionary:write'];

    const response = await app.inject({ method: 'GET', url: '/diccionario' });

    expect(response.statusCode).toBe(200);
  });

  it('no concede acceso por el nombre del rol en el JWT', async () => {
    currentUser = {
      userId: 4n,
      username: 'falso',
      roles: ['super_admin', 'editor'],
    };
    permisosEnBD = [];

    const response = await app.inject({ method: 'GET', url: '/diccionario' });

    expect(response.statusCode).toBe(403);
  });
});

describe('requireAnyPermission', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    currentUser = undefined;
    permisosEnBD = [];

    app = Fastify({ logger: false });
    app.addHook('preHandler', async (request) => {
      if (currentUser !== undefined) {
        // biome-ignore lint/suspicious/noExplicitAny: simula authMiddleware
        (request as any).user = currentUser;
      }
    });

    app.get(
      '/cola-revision',
      {
        preHandler: requireAnyPermission(
          [PERMISSIONS.TAXONOMIA_RATIFICAR, PERMISSIONS.DICCIONARIO_LEER],
          async () => permisosEnBD,
        ),
      },
      async () => ({ ok: true }),
    );

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve 401 cuando no hay usuario autenticado', async () => {
    const response = await app.inject({ method: 'GET', url: '/cola-revision' });

    expect(response.statusCode).toBe(401);
  });

  it('devuelve 403 cuando el usuario no tiene ninguno de los permisos requeridos', async () => {
    currentUser = {
      userId: 5n,
      username: 'sin_permisos',
      roles: ['media_admin'],
    };
    permisosEnBD = [];

    const response = await app.inject({ method: 'GET', url: '/cola-revision' });

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body).error).toBe('Forbidden');
  });

  it('permite el acceso cuando el usuario tiene al menos uno de los permisos', async () => {
    currentUser = {
      userId: 6n,
      username: 'revisor',
      roles: ['cultural_reviewer'],
    };
    permisosEnBD = ['dictionary:read'];

    const response = await app.inject({ method: 'GET', url: '/cola-revision' });

    expect(response.statusCode).toBe(200);
  });
});

describe('matriz de roles', () => {
  it('super_admin tiene todos los permisos del catálogo', () => {
    const rol = ROLE_CATALOG.find((r) => r.name === 'super_admin');

    expect(rol?.permissions).toContain(PERMISSIONS.DICCIONARIO_LEER);
    expect(rol?.permissions).toContain(PERMISSIONS.DICCIONARIO_ESCRIBIR);
    expect(rol?.permissions).toContain(PERMISSIONS.TAXONOMIA_RATIFICAR);
    expect(rol?.permissions).toContain(PERMISSIONS.AUDITORIA_LEER);
  });

  it('cultural_reviewer ratifica y lee pero no edita la estructura', () => {
    const rol = ROLE_CATALOG.find((r) => r.name === 'cultural_reviewer');

    expect(rol?.permissions).toContain(PERMISSIONS.TAXONOMIA_RATIFICAR);
    expect(rol?.permissions).toContain(PERMISSIONS.DICCIONARIO_LEER);
    expect(rol?.permissions).not.toContain(PERMISSIONS.DICCIONARIO_ESCRIBIR);
  });

  it('content_admin edita y lee pero no ratifica contenido cultural', () => {
    const rol = ROLE_CATALOG.find((r) => r.name === 'content_admin');

    expect(rol?.permissions).toContain(PERMISSIONS.DICCIONARIO_ESCRIBIR);
    expect(rol?.permissions).toContain(PERMISSIONS.DICCIONARIO_LEER);
    expect(rol?.permissions).not.toContain(PERMISSIONS.TAXONOMIA_RATIFICAR);
  });

  it('analytics_viewer solo tiene permisos de solo lectura', () => {
    const rol = ROLE_CATALOG.find((r) => r.name === 'analytics_viewer');

    expect(rol?.permissions).toContain(PERMISSIONS.AUDITORIA_LEER);
    expect(rol?.permissions).toContain(PERMISSIONS.DICCIONARIO_LEER);
    expect(rol?.permissions).toContain(PERMISSIONS.MEDIOS_LEER);
    expect(rol?.permissions).not.toContain(PERMISSIONS.DICCIONARIO_ESCRIBIR);
    expect(rol?.permissions).not.toContain(PERMISSIONS.MEDIOS_ESCRIBIR);
  });
});

describe('requirePasswordChanged', () => {
  let app: FastifyInstance;
  let mustChangeFlag = false;
  let accountActiveFlag = true;

  beforeEach(async () => {
    currentUser = undefined;
    mustChangeFlag = false;
    accountActiveFlag = true;

    app = Fastify({ logger: false });
    app.addHook('preHandler', async (request) => {
      if (currentUser !== undefined) {
        // biome-ignore lint/suspicious/noExplicitAny: simula authMiddleware
        (request as any).user = currentUser;
      }
    });

    app.get(
      '/admin-secret',
      {
        preHandler: requirePasswordChanged(
          async () => mustChangeFlag,
          async () => accountActiveFlag,
        ),
      },
      async () => ({ secret: true }),
    );

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve 401 si no hay usuario autenticado', async () => {
    const response = await app.inject({ method: 'GET', url: '/admin-secret' });
    expect(response.statusCode).toBe(401);
  });

  it('devuelve 403 AUTH_ACCOUNT_SUSPENDED si la cuenta fue desactivada (Spec 013 R-010)', async () => {
    currentUser = {
      userId: 10n,
      username: 'suspended_user',
      roles: ['content_admin'],
    };
    accountActiveFlag = false;

    const response = await app.inject({ method: 'GET', url: '/admin-secret' });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('AUTH_ACCOUNT_SUSPENDED');
  });

  it('devuelve 403 con mensaje claro si must_change_password es true', async () => {
    currentUser = {
      userId: 10n,
      username: 'must_change_user',
      roles: ['super_admin'],
    };
    mustChangeFlag = true;

    const response = await app.inject({ method: 'GET', url: '/admin-secret' });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('Debe cambiar su contraseña');
  });

  it('permite el acceso si must_change_password es false', async () => {
    currentUser = {
      userId: 10n,
      username: 'normal_user',
      roles: ['admin'],
    };
    mustChangeFlag = false;

    const response = await app.inject({ method: 'GET', url: '/admin-secret' });

    expect(response.statusCode).toBe(200);
  });
});
