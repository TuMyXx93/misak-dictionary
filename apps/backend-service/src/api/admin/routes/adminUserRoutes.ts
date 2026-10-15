/**
 * Admin User Routes
 * Spec 002 - Auth RBAC
 * R-007: gestión de roles de usuario exclusiva para super_admin,
 * con auditoría obligatoria de cada cambio.
 */

import type { FastifyInstance } from 'fastify';
import { ZodError, z } from 'zod';
import { ManageUserRolesUseCase } from '../../../application/use-cases/admin/ManageUserRolesUseCase.js';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import { requireSuperAdmin } from '../../../presentation/middleware/authorizationMiddleware.js';
import { AuditService } from '../../../shared/audit/AuditService.js';

const RoleParamSchema = z.object({
  role: z.string().min(1).max(50),
});

export async function adminUserRoutes(app: FastifyInstance): Promise<void> {
  const userRepository = new UserRepository();
  const auditService = new AuditService();
  const manageRoles = new ManageUserRolesUseCase(userRepository, auditService);

  await app.register(
    async (adminApp) => {
      // R-001/002: todo requiere sesión válida y rol super_admin
      adminApp.addHook('onRequest', authMiddleware);
      adminApp.addHook('onRequest', requireSuperAdmin);

      /**
       * POST /api/admin/users/:id/roles
       * Asignar un rol a un usuario (auditado)
       */
      adminApp.post('/:id/roles', async (request, reply) => {
        try {
          const { id } = request.params as { id: string };
          const body = RoleParamSchema.parse(request.body);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (request as any).user as {
            userId: string;
            username: string;
          };

          await manageRoles.assign({
            targetUserId: BigInt(id),
            roleName: body.role,
            actorUserId: BigInt(user.userId),
            actorUsername: user.username,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });

          return reply.code(200).send({
            statusCode: 200,
            message: 'Role assigned',
          });
        } catch (error) {
          if (error instanceof ZodError) {
            return reply.code(400).send({
              statusCode: 400,
              error: 'Validation Error',
              message: error.issues[0]?.message ?? 'Validation failed',
            });
          }
          if (error instanceof Error && error.message === 'Role not found') {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Role not found',
            });
          }
          if (error instanceof Error && error.message === 'User not found') {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'User not found',
            });
          }
          if (error instanceof Error && error.message.includes('last super_admin')) {
            return reply.code(409).send({
              statusCode: 409,
              error: 'Conflict',
              message: error.message,
            });
          }
          request.log.error(error);
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Could not assign role',
          });
        }
      });

      /**
       * DELETE /api/admin/users/:id/roles/:role
       * Revocar un rol (auditado; protege al último super_admin)
       */
      adminApp.delete('/:id/roles/:role', async (request, reply) => {
        try {
          const { id, role } = request.params as { id: string; role: string };
          RoleParamSchema.parse({ role });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (request as any).user as {
            userId: string;
            username: string;
          };

          await manageRoles.revoke({
            targetUserId: BigInt(id),
            roleName: role,
            actorUserId: BigInt(user.userId),
            actorUsername: user.username,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });

          return reply.code(200).send({
            statusCode: 200,
            message: 'Role revoked',
          });
        } catch (error) {
          if (error instanceof Error && error.message === 'Role not found') {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Role not found',
            });
          }
          if (error instanceof Error && error.message === 'User not found') {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'User not found',
            });
          }
          if (error instanceof Error && error.message.includes('last super_admin')) {
            return reply.code(409).send({
              statusCode: 409,
              error: 'Conflict',
              message: error.message,
            });
          }
          request.log.error(error);
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Could not revoke role',
          });
        }
      });
    },
    { prefix: '/api/admin/users' },
  );
}
