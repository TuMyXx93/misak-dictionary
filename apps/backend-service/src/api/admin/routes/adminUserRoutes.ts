/**
 * Admin User Routes
 * Spec 002 - Auth RBAC
 * R-007: gestión de roles de usuario exclusiva para super_admin,
 * con auditoría obligatoria de cada cambio.
 */

import type { FastifyInstance } from 'fastify';
import { ZodError, z } from 'zod';
import { ListUsersUseCase } from '../../../application/use-cases/admin/ListUsersUseCase.js';
import { ManageUserRolesUseCase } from '../../../application/use-cases/admin/ManageUserRolesUseCase.js';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requireSuperAdmin,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

const RoleParamSchema = z.object({
  role: z.string().min(1).max(50),
});

const PatchRolesBodySchema = z.object({
  roles: z.array(z.string()).optional(),
  role: z.string().optional(),
});

export async function adminUserRoutes(app: FastifyInstance): Promise<void> {
  const userRepository = new UserRepository();
  const auditService = new AuditService();
  const manageRoles = new ManageUserRolesUseCase(userRepository, auditService);
  const listUsersUseCase = new ListUsersUseCase();

  await app.register(
    async (adminApp) => {
      // R-001/002/028: todo requiere sesión válida, contraseña cambiada y rol super_admin
      adminApp.addHook('onRequest', authMiddleware);
      adminApp.addHook('onRequest', requirePasswordChanged());
      adminApp.addHook('onRequest', requireSuperAdmin);

      /**
       * GET /api/admin/users
       * Listado paginado de usuarios (R-018, super_admin)
       */
      adminApp.get('/', async (request, reply) => {
        const query = request.query as { cursor?: string; limit?: string };
        const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
        const result = await listUsersUseCase.execute({
          cursor: query.cursor,
          limit: Number.isNaN(limit) ? undefined : limit,
        });
        return reply.code(200).send(result);
      });

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
       * PATCH /api/admin/users/:id/roles
       * Actualizar roles de un usuario (auditado)
       */
      adminApp.patch('/:id/roles', async (request, reply) => {
        try {
          const { id } = request.params as { id: string };
          const body = PatchRolesBodySchema.parse(request.body);
          const rolesToSet = body.roles ?? (body.role ? [body.role] : []);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (request as any).user as {
            userId: string;
            username: string;
          };

          const target = await userRepository.findByIdWithRoles(BigInt(id));
          if (!target) {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'User not found',
            });
          }

          const currentRoleNames = target.roles.map((r) => r.role.name);
          const toAdd = rolesToSet.filter((r) => !currentRoleNames.includes(r));
          const toRemove = currentRoleNames.filter((r) => !rolesToSet.includes(r));

          for (const r of toAdd) {
            await manageRoles.assign({
              targetUserId: BigInt(id),
              roleName: r,
              actorUserId: BigInt(user.userId),
              actorUsername: user.username,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            });
          }

          for (const r of toRemove) {
            await manageRoles.revoke({
              targetUserId: BigInt(id),
              roleName: r,
              actorUserId: BigInt(user.userId),
              actorUsername: user.username,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            });
          }

          const updatedTarget = await userRepository.findByIdWithRoles(BigInt(id));
          return reply.code(200).send(serializeBigInt(updatedTarget));
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
            message: 'Could not update roles',
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
