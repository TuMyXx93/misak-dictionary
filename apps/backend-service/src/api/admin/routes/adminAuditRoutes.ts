/**
 * Admin Audit Routes
 * Spec 006 (R-019) - Rutas de consulta paginada y filtrable de logs de auditoría.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ListAuditUseCase } from '../../../application/use-cases/admin/ListAuditUseCase.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

const ACTION_MAPPING: Record<string, string> = {
  'sentido:create': 'create',
  'sentido:update': 'update',
  'sentido:ratify': 'ratify',
  'sentido:revert': 'revert_ratification',
  'sentido:delete': 'delete',
  'sentido:restore': 'restore',
  'sentido:purge': 'purge',
  'user:roles_update': 'admin.role.assigned',
  'settings:update': 'settings.update',
};

const AuditQuerySchema = z
  .object({
    actorUserId: z.string().optional(),
    userId: z.string().optional(),
    entity: z.string().optional(),
    action: z.string().optional(),
    desde: z
      .string()
      .datetime({ offset: true })
      .optional()
      .or(
        z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      )
      .transform((val) => (val ? new Date(val) : undefined)),
    hasta: z
      .string()
      .datetime({ offset: true })
      .optional()
      .or(
        z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      )
      .transform((val) => (val ? new Date(val) : undefined)),
    cursor: z.string().optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
  })
  .transform((data) => ({
    ...data,
    actorUserId: data.actorUserId ?? data.userId,
    action: data.action ? (ACTION_MAPPING[data.action] ?? data.action) : undefined,
  }));

export async function adminAuditRoutes(app: FastifyInstance): Promise<void> {
  const listAuditUseCase = new ListAuditUseCase();

  // Guardas globales del plugin: Autenticación requerida, contraseña cambiada y permiso de auditoría
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', requirePasswordChanged());

  /**
   * GET /api/admin/audit
   * Listado paginado de logs de auditoría (requiere audit:read)
   */
  app.get(
    '/',
    { preHandler: [requirePermission(PERMISSIONS.AUDITORIA_LEER)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedQuery = AuditQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        throw new AppError('Parámetros de consulta de auditoría inválidos', 400);
      }

      const resultado = await listAuditUseCase.execute(parsedQuery.data);
      return reply.code(200).send(serializeBigInt(resultado));
    },
  );
}
