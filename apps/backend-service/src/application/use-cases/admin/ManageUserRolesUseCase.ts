/**
 * ManageUserRolesUseCase
 * Spec 002 - Auth RBAC
 * R-007: asignar/revocar roles de usuario con auditoría obligatoria.
 * Solo alcanzable por el rol super_admin (vía middleware).
 */

import type { IUserRepository } from '../../../domain/interfaces/IAuthServices.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';

export interface AssignRoleInput {
  targetUserId: bigint;
  roleName: string;
  actorUserId: bigint;
  actorUsername: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class ManageUserRolesUseCase {
  constructor(
    private readonly userRepository: IUserRepository & {
      assignRole: (userId: bigint, roleId: bigint) => Promise<void>;
      revokeRole: (userId: bigint, roleId: bigint) => Promise<void>;
      findRoleByName: (name: string) => Promise<{ id: bigint; name: string } | null>;
      countSuperAdmins: () => Promise<number>;
    },
    private readonly auditService: AuditService,
  ) {}

  async assign(input: AssignRoleInput): Promise<void> {
    const role = await this.userRepository.findRoleByName(input.roleName);
    if (!role) {
      throw new Error('Role not found');
    }

    const target = await this.userRepository.findByIdWithRoles(input.targetUserId);
    if (!target) {
      // R-011: no revelar existencia más allá de lo necesario al admin,
      // pero el admin necesita saber si el objetivo existe: 404 explícito aquí.
      throw new Error('User not found');
    }

    await this.userRepository.assignRole(input.targetUserId, role.id);

    await this.auditService.record({
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      action: 'admin.role.assigned',
      entity: 'user',
      entityId: input.targetUserId.toString(),
      newData: { role: input.roleName, targetUsername: target.username },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }

  async revoke(input: AssignRoleInput): Promise<void> {
    const role = await this.userRepository.findRoleByName(input.roleName);
    if (!role) {
      throw new Error('Role not found');
    }

    const target = await this.userRepository.findByIdWithRoles(input.targetUserId);
    if (!target) {
      throw new Error('User not found');
    }

    // Salvaguarda: no permitir que el último super_admin pierda su rol
    if (input.roleName === 'super_admin') {
      const superAdminCount = await this.userRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new Error('Cannot revoke the last super_admin');
      }
    }

    await this.userRepository.revokeRole(input.targetUserId, role.id);

    await this.auditService.record({
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      action: 'admin.role.revoked',
      entity: 'user',
      entityId: input.targetUserId.toString(),
      oldData: { role: input.roleName, targetUsername: target.username },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
