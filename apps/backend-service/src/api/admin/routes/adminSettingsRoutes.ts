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
  requireSuperAdmin,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { SystemSettingsService } from '../../../shared/settings/SystemSettingsService.js';

const UpdatePublicOnlyRatifiedBodySchema = z.object({
  enabled: z.boolean({
    message: 'El campo enabled es requerido y debe ser booleano',
  }),
});

export async function adminSettingsRoutes(app: FastifyInstance): Promise<void> {
  const settingsService = new SystemSettingsService();

  // Guardas globales del plugin: Autenticación requerida, contraseña cambiada y super_admin
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', requirePasswordChanged());
  app.addHook('onRequest', requireSuperAdmin);

  /**
   * GET /api/admin/settings/public-only-ratified
   * Consulta el estado de la bandera PUBLIC_ONLY_RATIFIED (solo super_admin)
   */
  app.get('/public-only-ratified', async (_request: FastifyRequest, reply: FastifyReply) => {
    const enabled = await settingsService.getPublicOnlyRatified();
    return reply.code(200).send({ enabled });
  });

  /**
   * PUT /api/admin/settings/public-only-ratified
   * Actualiza el estado de la bandera PUBLIC_ONLY_RATIFIED (solo super_admin)
   */
  app.put('/public-only-ratified', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsedBody = UpdatePublicOnlyRatifiedBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      throw new AppError(parsedBody.error.issues[0]?.message ?? 'Datos inválidos', 400);
    }

    const actor = request.user;
    if (!actor) {
      throw new AppError('No estás autenticado', 401);
    }

    const updated = await settingsService.setPublicOnlyRatified(parsedBody.data.enabled, {
      userId: BigInt(actor.userId),
      username: actor.username,
    });

    return reply.code(200).send({ enabled: updated });
  });
}
