/**
 * Authorization Middleware
 * Sprint 4 - Admin API
 * Middleware para verificar roles de usuario y permisos
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { PermissionRepository } from '../../infrastructure/repositories/PermissionRepository.js';

/**
 * Verificar si el usuario tiene alguno de los roles requeridos
 */
export function requireRoles(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // El authMiddleware ya verificó el token y añadió user a request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (request as any).user;

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'No estás autenticado',
      });
    }

    // Verificar si el usuario tiene alguno de los roles permitidos
    const userRoles = user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Se requiere uno de estos roles: ${allowedRoles.join(', ')}`,
      });
    }

    // Usuario autorizado, continuar
  };
}

/**
 * Middleware para verificar si es super_admin
 */
export const requireSuperAdmin = requireRoles('super_admin');

/**
 * Middleware para verificar si es admin o super_admin
 */
export const requireAdmin = requireRoles('admin', 'super_admin');

export type PermissionResolver = (userId: bigint) => Promise<string[]>;

const permissionRepository = new PermissionRepository();
const defaultPermissionResolver: PermissionResolver = (userId) =>
  permissionRepository.findPermissionNamesForUser(userId);

/**
 * Verificar que el usuario tenga un permiso ("recurso:acción").
 * Los permisos se leen de la base en cada petición, no del JWT,
 * así que una revocación surte efecto de inmediato.
 */
export function requirePermission(
  permission: string,
  resolvePermissions: PermissionResolver = defaultPermissionResolver,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'No estás autenticado',
      });
    }

    const permisos = await resolvePermissions(user.userId);

    if (!permisos.includes(permission)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Se requiere el permiso ${permission}`,
      });
    }
  };
}
