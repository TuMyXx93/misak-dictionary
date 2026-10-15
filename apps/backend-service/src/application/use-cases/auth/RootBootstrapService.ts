/**
 * RootBootstrapService
 * Spec 002 - Auth RBAC
 * R-008: crea el usuario root inicial si ROOT_BOOTSTRAP_EMAIL/PASSWORD
 * están definidos y no existe ningún super_admin activo.
 * Idempotente: en arranques posteriores no hace nada.
 * R-009: mientras no exista root, los endpoints de administración quedan
 * cerrados de facto (ningún token puede portar el rol super_admin).
 */

import { PasswordService } from '../../../infrastructure/auth/PasswordService.js';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';
import { AuditService } from '../../../shared/audit/AuditService.js';
import { env } from '../../../shared/config/env.js';

export class RootBootstrapService {
  constructor(
    private readonly userRepository: UserRepository = new UserRepository(),
    private readonly passwordService: PasswordService = new PasswordService(),
    private readonly auditService: AuditService = new AuditService(),
  ) {}

  /**
   * Ejecuta el bootstrap. Devuelve true si creó el root.
   */
  async ensureRootExists(): Promise<boolean> {
    const email = env.ROOT_BOOTSTRAP_EMAIL;
    const password = env.ROOT_BOOTSTRAP_PASSWORD;

    if (!email || !password) {
      return false;
    }

    // ¿Ya existe un super_admin activo?
    const superAdmins = await this.userRepository.countSuperAdmins();
    if (superAdmins > 0) {
      return false;
    }

    const role = await this.userRepository.findRoleByName('super_admin');
    if (!role) {
      console.error('[root-bootstrap] No existe el rol "super_admin". Ejecuta el seed de roles.');
      return false;
    }

    const username = email.split('@')[0] ?? email;
    const passwordHash = await this.passwordService.hash(password);

    await this.userRepository.createWithRole({
      username,
      email,
      password: passwordHash,
      fullName: 'Administrador del Diccionario',
      roleId: role.id,
    });

    await this.auditService.record({
      action: 'auth.root.bootstrap',
      entity: 'user',
      entityId: username,
      newData: { email, role: 'super_admin' },
    });

    console.log(`[root-bootstrap] Usuario root creado: ${username} (${email})`);
    return true;
  }
}
