/**
 * GetAuthMeUseCase
 * Spec 006 - Panel Administrativo y Gobierno Editorial
 * R-003: Resuelve los datos del usuario autenticado, sus roles y sus permisos
 * directamente en servidor en cada llamada para que cambios de permisos tengan
 * efecto inmediato.
 */

import type { PermissionRepository } from '../../../infrastructure/repositories/PermissionRepository.js';
import type { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';

export interface GetAuthMeInput {
  userId: bigint;
}

export interface GetAuthMeOutput {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  mustChangePassword: boolean;
  roles: string[];
  permissions: string[];
}

export class GetAuthMeUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(input: GetAuthMeInput): Promise<GetAuthMeOutput> {
    const user = await this.userRepository.findByIdWithRoles(input.userId);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    const permissions = await this.permissionRepository.findPermissionNamesForUser(input.userId);

    return {
      userId: user.id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword ?? false,
      roles: user.roles.map((r) => r.role.name),
      permissions,
    };
  }
}
