/**
 * Admin Settings Routes
 * Spec 006 (R-026) - Rutas de configuración administrativa global del sistema.
 * Restringido exclusivamente al rol super_admin.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { SystemSettingsService } from '../../../shared/settings/SystemSettingsService.js';

const UpdatePublicOnlyRatifiedBodySchema = z
  .object({
    enabled: z.boolean().optional(),
    value: z.boolean().optional(),
  })
  .refine((data) => data.enabled !== undefined || data.value !== undefined, {
    message: 'El campo enabled o value es requerido y debe ser booleano',
  });

export async function adminSettingsRoutes(app: FastifyInstance): Promise<void> {
  const settingsService = new SystemSettingsService();

  // Guardas globales del plugin: Autenticación requerida, contraseña cambiada y permiso settings:manage
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', requirePasswordChanged());
  app.addHook('onRequest', requirePermission(PERMISSIONS.AJUSTES_GESTIONAR));

  /**
   * GET /api/admin/settings/public-only-ratified
   * Consulta el estado de la bandera PUBLIC_ONLY_RATIFIED (solo super_admin)
   */
  app.get('/public-only-ratified', async (_request: FastifyRequest, reply: FastifyReply) => {
    const enabled = await settingsService.getPublicOnlyRatified();
    return reply.code(200).send({
      enabled,
      value: enabled,
      publicOnlyRatified: enabled,
    });
  });

  /**
   * PUT & PATCH /api/admin/settings/public-only-ratified
   * Actualiza el estado de la bandera PUBLIC_ONLY_RATIFIED (solo super_admin)
   */
  const handleUpdate = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsedBody = UpdatePublicOnlyRatifiedBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      throw new AppError(parsedBody.error.issues[0]?.message ?? 'Datos inválidos', 400);
    }

    const actor = request.user;
    if (!actor) {
      throw new AppError('No estás autenticado', 401);
    }

    const isEnabled = parsedBody.data.enabled ?? parsedBody.data.value ?? false;

    const updated = await settingsService.setPublicOnlyRatified(isEnabled, {
      userId: BigInt(actor.userId),
      username: actor.username,
    });

    return reply.code(200).send({
      enabled: updated,
      value: updated,
      publicOnlyRatified: updated,
    });
  };

  app.put('/public-only-ratified', handleUpdate);
  app.patch('/public-only-ratified', handleUpdate);
}
