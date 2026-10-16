/**
 * @module RootBootstrapService.test
 * @description Pruebas unitarias para RootBootstrapService (R-028).
 */

import { describe, expect, it, vi } from 'vitest';
import type { PasswordService } from '../../../infrastructure/auth/PasswordService.js';
import type { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { RootBootstrapService } from './RootBootstrapService.js';

vi.mock('../../../shared/config/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shared/config/env.js')>();
  return {
    ...actual,
    env: {
      ...actual.env,
      ROOT_BOOTSTRAP_EMAIL: 'namtrik-admin@misak-dictionary.org',
      ROOT_BOOTSTRAP_PASSWORD: 'SuperSecureRootPassword2026!',
    },
  };
});

describe('RootBootstrapService', () => {
  it('crea el usuario super_admin institucional con mustChangePassword = true', async () => {
    const mockUserRepository = {
      countSuperAdmins: vi.fn().mockResolvedValue(0),
      findRoleByName: vi.fn().mockResolvedValue({ id: 100n, name: 'super_admin' }),
      createWithRole: vi.fn().mockResolvedValue({ id: 1n }),
    } as unknown as UserRepository;

    const mockPasswordService = {
      hash: vi.fn().mockResolvedValue('argon2_root_hash'),
    } as unknown as PasswordService;

    const mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;

    const service = new RootBootstrapService(
      mockUserRepository,
      mockPasswordService,
      mockAuditService,
    );

    const created = await service.ensureRootExists();

    expect(created).toBe(true);
    expect(mockUserRepository.createWithRole).toHaveBeenCalledWith({
      username: 'namtrik-admin',
      email: 'namtrik-admin@misak-dictionary.org',
      password: 'argon2_root_hash',
      fullName: 'Administrador del Diccionario',
      roleId: 100n,
      mustChangePassword: true,
    });
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.root.bootstrap',
        newData: expect.objectContaining({ mustChangePassword: true }),
      }),
    );
  });

  it('no crea el usuario si ya existe al menos un super_admin activo', async () => {
    const mockUserRepository = {
      countSuperAdmins: vi.fn().mockResolvedValue(1),
    } as unknown as UserRepository;

    const service = new RootBootstrapService(mockUserRepository);
    const created = await service.ensureRootExists();

    expect(created).toBe(false);
  });
});
