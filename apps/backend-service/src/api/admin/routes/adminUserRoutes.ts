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
import { ResetUserPasswordUseCase } from '../../../application/use-cases/admin/ResetUserPasswordUseCase.js';
import { ToggleUserStatusUseCase } from '../../../application/use-cases/admin/ToggleUserStatusUseCase.js';
import { PasswordService } from '../../../infrastructure/auth/PasswordService.js';
import { SessionRepository } from '../../../infrastructure/repositories/SessionRepository.js';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';
import { authMiddleware } from '../../../presentation/middleware/authMiddleware.js';
import {
  requirePasswordChanged,
  requirePermission,
} from '../../../presentation/middleware/authorizationMiddleware.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { PERMISSIONS } from '../../../shared/auth/permissions.js';
import { serializeBigInt } from '../../../shared/utils/serializeBigInt.js';

export function cleanString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

export function generateCandidateUsername(nombres: string, apellidos: string): string {
  const cleanNombres = cleanString(nombres).split(/\s+/).filter(Boolean);
  const cleanApellidos = cleanString(apellidos).split(/\s+/).filter(Boolean);

  const primerNombre = cleanNombres[0] || 'usuario';
  const primerApellido = cleanApellidos[0] || '';

  return primerApellido ? `${primerNombre}.${primerApellido}` : primerNombre;
}

const RoleParamSchema = z.object({
  role: z.string().min(1).max(50),
});

const PatchRolesBodySchema = z.object({
  roles: z.array(z.string()).optional(),
  role: z.string().optional(),
});

const CreateUserBodySchema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(50)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'El username solo permite letras, números, puntos, guiones y guiones bajos',
    ),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombres: z.string().min(1, 'El nombre o nombres son obligatorios').optional(),
  apellidos: z.string().min(1, 'El apellido o apellidos son obligatorios').optional(),
  tipoIdentificacion: z.enum(['CC', 'TI', 'CE', 'PASAPORTE', 'OTRO']).default('CC'),
  numeroIdentificacion: z.string().optional().nullable(),
  telefonoContacto: z.string().optional().nullable(),
  direccionResidencia: z.string().optional().nullable(),
  barrio: z.string().optional().nullable(),
  departamento: z.string().optional().nullable(),
  ciudadMunicipio: z.string().optional().nullable(),
  fullName: z.string().optional(),
  roles: z.array(z.string()).min(1, 'Debe asignar al menos un rol').default(['content_admin']),
});

const UpdateUserBodySchema = z.object({
  email: z.string().email('Email inválido').optional(),
  username: z
    .string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(50)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'El username solo permite letras, números, puntos, guiones y guiones bajos',
    )
    .optional(),
  nombres: z.string().optional(),
  apellidos: z.string().optional(),
  tipoIdentificacion: z.enum(['CC', 'TI', 'CE', 'PASAPORTE', 'OTRO']).optional(),
  numeroIdentificacion: z.string().optional().nullable(),
  telefonoContacto: z.string().optional().nullable(),
  direccionResidencia: z.string().optional().nullable(),
  barrio: z.string().optional().nullable(),
  departamento: z.string().optional().nullable(),
  ciudadMunicipio: z.string().optional().nullable(),
  fullName: z.string().optional(),
  isActive: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
});

const ToggleStatusBodySchema = z.object({
  isActive: z.boolean(),
  motivo: z.string().max(255).optional(),
});

const ResetPasswordBodySchema = z.object({
  temporaryPassword: z.string().min(8).max(100).optional(),
});

export async function adminUserRoutes(app: FastifyInstance): Promise<void> {
  const userRepository = new UserRepository();
  const sessionRepository = new SessionRepository();
  const passwordService = new PasswordService();
  const auditService = new AuditService();
  const manageRoles = new ManageUserRolesUseCase(userRepository, auditService);
  const listUsersUseCase = new ListUsersUseCase();
  const toggleStatusUseCase = new ToggleUserStatusUseCase(
    userRepository,
    sessionRepository,
    auditService,
  );
  const resetPasswordUseCase = new ResetUserPasswordUseCase(
    userRepository,
    passwordService,
    sessionRepository,
    auditService,
  );

  await app.register(
    async (adminApp) => {
      // R-001/002/028: requiere sesión válida, contraseña cambiada y permiso de gestión de usuarios
      adminApp.addHook('onRequest', authMiddleware);
      adminApp.addHook('onRequest', requirePasswordChanged());
      adminApp.addHook('onRequest', requirePermission(PERMISSIONS.USUARIOS_GESTIONAR));

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
       * GET /api/admin/users/suggest-username
       * Genera y valida sugerencia inteligente de username sin colisiones
       */
      adminApp.get('/suggest-username', async (request, reply) => {
        const query = request.query as { nombres?: string; apellidos?: string };
        const nombres = (query.nombres || '').trim();
        const apellidos = (query.apellidos || '').trim();

        if (!nombres && !apellidos) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Debe especificar nombres o apellidos',
          });
        }

        const base = generateCandidateUsername(nombres, apellidos);
        let candidate = base;
        let counter = 1;

        while (await userRepository.findByUsername(candidate)) {
          candidate = `${base}${counter}`;
          counter++;
        }

        return reply.code(200).send({
          username: candidate,
          available: true,
        });
      });

      /**
       * POST /api/admin/users
       * Crear un nuevo usuario del equipo editorial (super_admin)
       */
      adminApp.post('/', async (request, reply) => {
        try {
          const body = CreateUserBodySchema.parse(request.body);
          const existingUsername = await userRepository.findByUsername(body.username);
          if (existingUsername) {
            return reply.code(409).send({
              statusCode: 409,
              error: 'Conflict',
              message: 'El nombre de usuario ya está registrado',
            });
          }

          const existingEmail = await userRepository.findByEmail(body.email);
          if (existingEmail) {
            return reply.code(409).send({
              statusCode: 409,
              error: 'Conflict',
              message: 'El correo electrónico ya está registrado',
            });
          }

          const passwordService = new PasswordService();
          const hashedPassword = await passwordService.hash(body.password);

          const computedFullName =
            body.fullName ??
            (body.nombres && body.apellidos
              ? `${body.nombres} ${body.apellidos}`.trim()
              : (body.nombres ?? body.username));

          const newUser = await userRepository.create({
            username: body.username,
            email: body.email,
            password: hashedPassword,
            fullName: computedFullName,
            nombres: body.nombres ?? null,
            apellidos: body.apellidos ?? null,
            tipoIdentificacion: body.tipoIdentificacion ?? 'CC',
            numeroIdentificacion: body.numeroIdentificacion ?? null,
            telefonoContacto: body.telefonoContacto ?? null,
            direccionResidencia: body.direccionResidencia ?? null,
            barrio: body.barrio ?? null,
            departamento: body.departamento ?? null,
            ciudadMunicipio: body.ciudadMunicipio ?? null,
            mustChangePassword: true,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actor = (request as any).user as {
            userId: string;
            username: string;
            roles?: string[];
          };

          if (body.roles.includes('super_admin') && !actor.roles?.includes('super_admin')) {
            return reply.code(403).send({
              statusCode: 403,
              error: 'Forbidden',
              message: 'Solo un superadministrador puede asignar el rol super_admin',
            });
          }

          for (const roleName of body.roles) {
            await manageRoles.assign({
              targetUserId: newUser.id,
              roleName,
              actorUserId: BigInt(actor.userId),
              actorUsername: actor.username,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            });
          }

          await auditService.record({
            action: 'user.create',
            entity: 'user',
            entityId: newUser.id.toString(),
            actorUserId: BigInt(actor.userId),
            actorUsername: actor.username,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            newData: {
              username: newUser.username,
              email: newUser.email,
              nombres: newUser.nombres,
              apellidos: newUser.apellidos,
              tipoIdentificacion: newUser.tipoIdentificacion,
              numeroIdentificacion: newUser.numeroIdentificacion,
              telefonoContacto: newUser.telefonoContacto,
              direccionResidencia: newUser.direccionResidencia,
              barrio: newUser.barrio,
              departamento: newUser.departamento,
              ciudadMunicipio: newUser.ciudadMunicipio,
              roles: body.roles,
            },
          });

          return reply.code(201).send({
            id: newUser.id.toString(),
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            nombres: newUser.nombres,
            apellidos: newUser.apellidos,
            tipoIdentificacion: newUser.tipoIdentificacion,
            numeroIdentificacion: newUser.numeroIdentificacion,
            telefonoContacto: newUser.telefonoContacto,
            direccionResidencia: newUser.direccionResidencia,
            barrio: newUser.barrio,
            departamento: newUser.departamento,
            ciudadMunicipio: newUser.ciudadMunicipio,
            failedLoginAttempts: newUser.failedLoginAttempts,
            lockedUntil: newUser.lockedUntil,
            isActive: newUser.isActive,
            mustChangePassword: newUser.mustChangePassword,
            roles: body.roles,
            createdAt: newUser.createdAt,
          });
        } catch (error) {
          if (error instanceof ZodError) {
            return reply.code(400).send({
              statusCode: 400,
              error: 'Validation Error',
              message: error.issues[0]?.message ?? 'Validación fallida',
            });
          }
          if (error instanceof Error && error.message === 'Role not found') {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Uno o más roles especificados no existen',
            });
          }
          request.log.error(error);
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'No se pudo crear el usuario',
          });
        }
      });

      /**
       * GET /api/admin/users/:id
       * Retorna expediente completo de un usuario
       */
      adminApp.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const user = await userRepository.findByIdWithRoles(BigInt(id));
        if (!user) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Usuario no encontrado',
          });
        }
        return reply.code(200).send(serializeBigInt(user));
      });

      /**
       * PATCH /api/admin/users/:id
       * Edición de expediente de usuario (datos personales, contacto, residencia)
       */
      adminApp.patch('/:id', async (request, reply) => {
        try {
          const { id } = request.params as { id: string };
          const body = UpdateUserBodySchema.parse(request.body);
          const target = await userRepository.findByIdWithRoles(BigInt(id));
          if (!target) {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Usuario no encontrado',
            });
          }

          if (body.email && body.email.toLowerCase() !== target.email.toLowerCase()) {
            const existing = await userRepository.findByEmail(body.email);
            if (existing && existing.id !== BigInt(id)) {
              return reply.code(409).send({
                statusCode: 409,
                error: 'Conflict',
                message: 'El correo electrónico ya está registrado',
              });
            }
          }

          if (body.username && body.username.toLowerCase() !== target.username.toLowerCase()) {
            const existing = await userRepository.findByUsername(body.username);
            if (existing && existing.id !== BigInt(id)) {
              return reply.code(409).send({
                statusCode: 409,
                error: 'Conflict',
                message: 'El nombre de usuario ya está registrado',
              });
            }
          }

          const newNombres = body.nombres !== undefined ? body.nombres : target.nombres;
          const newApellidos = body.apellidos !== undefined ? body.apellidos : target.apellidos;
          const newFullName =
            body.fullName ??
            (newNombres || newApellidos
              ? `${newNombres ?? ''} ${newApellidos ?? ''}`.trim()
              : target.fullName);

          const updated = await userRepository.update(BigInt(id), {
            ...(body.email !== undefined ? { email: body.email } : {}),
            ...(body.username !== undefined ? { username: body.username } : {}),
            fullName: newFullName,
            ...(body.nombres !== undefined ? { nombres: body.nombres } : {}),
            ...(body.apellidos !== undefined ? { apellidos: body.apellidos } : {}),
            ...(body.tipoIdentificacion !== undefined
              ? { tipoIdentificacion: body.tipoIdentificacion }
              : {}),
            ...(body.numeroIdentificacion !== undefined
              ? { numeroIdentificacion: body.numeroIdentificacion }
              : {}),
            ...(body.telefonoContacto !== undefined
              ? { telefonoContacto: body.telefonoContacto }
              : {}),
            ...(body.direccionResidencia !== undefined
              ? { direccionResidencia: body.direccionResidencia }
              : {}),
            ...(body.barrio !== undefined ? { barrio: body.barrio } : {}),
            ...(body.departamento !== undefined ? { departamento: body.departamento } : {}),
            ...(body.ciudadMunicipio !== undefined
              ? { ciudadMunicipio: body.ciudadMunicipio }
              : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          });

          // Sincronizar roles si fueron enviados
          if (body.roles && Array.isArray(body.roles)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const actor = (request as any).user as { userId: string; username: string };
            const currentRoleNames = target.roles.map((r) => r.role.name);
            const rolesList = body.roles;
            const toAdd = rolesList.filter((r) => !currentRoleNames.includes(r));
            const toRemove = currentRoleNames.filter((r) => !rolesList.includes(r));

            for (const r of toAdd) {
              await manageRoles.assign({
                targetUserId: BigInt(id),
                roleName: r,
                actorUserId: BigInt(actor.userId),
                actorUsername: actor.username,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
              });
            }

            for (const r of toRemove) {
              await manageRoles.revoke({
                targetUserId: BigInt(id),
                roleName: r,
                actorUserId: BigInt(actor.userId),
                actorUsername: actor.username,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
              });
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actor = (request as any).user as { userId: string; username: string };
          await auditService.record({
            action: 'user.update',
            entity: 'user',
            entityId: id,
            actorUserId: BigInt(actor.userId),
            actorUsername: actor.username,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            oldData: {
              email: target.email,
              username: target.username,
              nombres: target.nombres,
              apellidos: target.apellidos,
              tipoIdentificacion: target.tipoIdentificacion,
              numeroIdentificacion: target.numeroIdentificacion,
              telefonoContacto: target.telefonoContacto,
              direccionResidencia: target.direccionResidencia,
              barrio: target.barrio,
              departamento: target.departamento,
              ciudadMunicipio: target.ciudadMunicipio,
            },
            newData: {
              email: updated.email,
              username: updated.username,
              nombres: updated.nombres,
              apellidos: updated.apellidos,
              tipoIdentificacion: updated.tipoIdentificacion,
              numeroIdentificacion: updated.numeroIdentificacion,
              telefonoContacto: updated.telefonoContacto,
              direccionResidencia: updated.direccionResidencia,
              barrio: updated.barrio,
              departamento: updated.departamento,
              ciudadMunicipio: updated.ciudadMunicipio,
            },
          });

          const refreshed = await userRepository.findByIdWithRoles(BigInt(id));
          return reply.code(200).send(serializeBigInt(refreshed));
        } catch (error) {
          if (error instanceof ZodError) {
            return reply.code(400).send({
              statusCode: 400,
              error: 'Validation Error',
              message: error.issues[0]?.message ?? 'Validación fallida',
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
            message: 'No se pudo actualizar el usuario',
          });
        }
      });

      /**
       * PATCH /api/admin/users/:id/status
       * Activar o suspender cuenta de usuario con revocación de sesiones (R-004)
       */
      adminApp.patch('/:id/status', async (request, reply) => {
        try {
          const { id } = request.params as { id: string };
          const body = ToggleStatusBodySchema.parse(request.body);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actor = (request as any).user as {
            userId: string;
            username: string;
            roles?: string[];
          };

          const updated = await toggleStatusUseCase.execute({
            targetUserId: BigInt(id),
            isActive: body.isActive,
            motivo: body.motivo,
            actorUserId: BigInt(actor.userId),
            actorUsername: actor.username,
            actorRoles: actor.roles ?? [],
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });

          return reply.code(200).send(serializeBigInt(updated));
        } catch (error: any) {
          if (error instanceof ZodError) {
            return reply.code(400).send({
              statusCode: 400,
              error: 'Validation Error',
              message: error.issues[0]?.message ?? 'Validación fallida',
            });
          }
          const statusCode = error.statusCode || 500;
          return reply.code(statusCode).send({
            statusCode,
            error:
              statusCode === 404
                ? 'Not Found'
                : statusCode === 409
                  ? 'Conflict'
                  : statusCode === 403
                    ? 'Forbidden'
                    : statusCode === 400
                      ? 'Bad Request'
                      : 'Internal Server Error',
            message: error.message || 'No se pudo cambiar el estado del usuario',
          });
        }
      });

      /**
       * POST /api/admin/users/:id/reset-password
       * Restablecer contraseña con clave temporal y forzar cambio al primer login (R-005)
       */
      adminApp.post('/:id/reset-password', async (request, reply) => {
        try {
          const { id } = request.params as { id: string };
          const body = ResetPasswordBodySchema.parse(request.body ?? {});
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actor = (request as any).user as {
            userId: string;
            username: string;
            roles?: string[];
          };

          const result = await resetPasswordUseCase.execute({
            targetUserId: BigInt(id),
            temporaryPassword: body.temporaryPassword,
            actorUserId: BigInt(actor.userId),
            actorUsername: actor.username,
            actorRoles: actor.roles ?? [],
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });

          return reply.code(200).send({
            statusCode: 200,
            message: 'Contraseña restablecida exitosamente',
            temporaryPassword: result.temporaryPassword,
            mustChangePassword: result.mustChangePassword,
            user: serializeBigInt(result.user),
          });
        } catch (error: any) {
          if (error instanceof ZodError) {
            return reply.code(400).send({
              statusCode: 400,
              error: 'Validation Error',
              message: error.issues[0]?.message ?? 'Validación fallida',
            });
          }
          const statusCode = error.statusCode || 500;
          return reply.code(statusCode).send({
            statusCode,
            error:
              statusCode === 404
                ? 'Not Found'
                : statusCode === 403
                  ? 'Forbidden'
                  : statusCode === 400
                    ? 'Bad Request'
                    : 'Internal Server Error',
            message: error.message || 'No se pudo restablecer la contraseña',
          });
        }
      });

      /**
       * POST /api/admin/users/:id/unlock
       * Desbloquear de inmediato la cuenta de un usuario bloqueado por intentos fallidos
       */
      adminApp.post('/:id/unlock', async (request, reply) => {
        try {
          const { id } = request.params as { id: string };
          const target = await userRepository.findById(BigInt(id));
          if (!target) {
            return reply.code(404).send({
              statusCode: 404,
              error: 'Not Found',
              message: 'Usuario no encontrado',
            });
          }

          const updated = await userRepository.unlockUser(BigInt(id));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actor = (request as any).user as { userId: string; username: string };
          await auditService.record({
            action: 'user.unlock',
            entity: 'user',
            entityId: id,
            actorUserId: BigInt(actor.userId),
            actorUsername: actor.username,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            newData: { failedLoginAttempts: 0, lockedUntil: null },
          });

          return reply.code(200).send({
            statusCode: 200,
            message: 'Cuenta de usuario desbloqueada exitosamente',
            user: serializeBigInt(updated),
          });
        } catch (error) {
          request.log.error(error);
          return reply.code(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'No se pudo desbloquear al usuario',
          });
        }
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
            roles?: string[];
          };

          if (body.role === 'super_admin' && !user.roles?.includes('super_admin')) {
            return reply.code(403).send({
              statusCode: 403,
              error: 'Forbidden',
              message: 'Solo un superadministrador puede asignar el rol super_admin',
            });
          }

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
            roles?: string[];
          };

          const involvesSuperAdmin =
            rolesToSet.includes('super_admin') ||
            (await userRepository.findByIdWithRoles(BigInt(id)))?.roles.some(
              (r) => r.role.name === 'super_admin',
            );

          if (involvesSuperAdmin && !user.roles?.includes('super_admin')) {
            return reply.code(403).send({
              statusCode: 403,
              error: 'Forbidden',
              message: 'Solo un superadministrador puede asignar o revocar el rol super_admin',
            });
          }

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
            roles?: string[];
          };

          const involvesSuperAdmin =
            role === 'super_admin' ||
            (await userRepository.findByIdWithRoles(BigInt(id)))?.roles.some(
              (r) => r.role.name === 'super_admin',
            );

          if (involvesSuperAdmin && !user.roles?.includes('super_admin')) {
            return reply.code(403).send({
              statusCode: 403,
              error: 'Forbidden',
              message: 'Solo un superadministrador puede asignar o revocar el rol super_admin',
            });
          }

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
