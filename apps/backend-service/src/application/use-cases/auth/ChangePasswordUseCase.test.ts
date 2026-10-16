/**
 * @module ChangePasswordUseCase.test
 * @description Pruebas unitarias para ChangePasswordUseCase (R-028).
 */

import { describe, expect, it, vi } from 'vitest';
import type { PasswordService } from '../../../infrastructure/auth/PasswordService.js';
import type { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { ChangePasswordUseCase } from './ChangePasswordUseCase.js';

describe('ChangePasswordUseCase', () => {
  const mockUser = {
    id: 1n,
    username: 'admin',
    email: 'admin@misak.org',
    password: 'hashed_old_password',
    fullName: 'Administrador',
    isActive: true,
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  it('cambia la contraseña exitosamente y limpia mustChangePassword', async () => {
    const mockUserRepository = {
      findById: vi.fn().mockResolvedValue(mockUser),
      updatePasswordAndClearMustChange: vi.fn().mockResolvedValue(undefined),
    } as unknown as UserRepository;

    const mockPasswordService = {
      compare: vi.fn().mockResolvedValue(true),
      hash: vi.fn().mockResolvedValue('hashed_new_password'),
    } as unknown as PasswordService;

    const mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;

    const useCase = new ChangePasswordUseCase(
      mockUserRepository,
      mockPasswordService,
      mockAuditService,
    );

    const result = await useCase.execute({
      userId: 1n,
      currentPassword: 'OldPassword123!',
      newPassword: 'NewSecurePassword2026!',
      ipAddress: '127.0.0.1',
    });

    expect(result.success).toBe(true);
    expect(mockPasswordService.compare).toHaveBeenCalledWith(
      'OldPassword123!',
      'hashed_old_password',
    );
    expect(mockPasswordService.hash).toHaveBeenCalledWith('NewSecurePassword2026!');
    expect(mockUserRepository.updatePasswordAndClearMustChange).toHaveBeenCalledWith(
      1n,
      'hashed_new_password',
    );
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.password.change',
        actorUserId: 1n,
      }),
    );
  });

  it('falla si la nueva contraseña tiene menos de 12 caracteres', async () => {
    const mockUserRepository = { findById: vi.fn() } as unknown as UserRepository;
    const mockPasswordService = { compare: vi.fn(), hash: vi.fn() } as unknown as PasswordService;

    const useCase = new ChangePasswordUseCase(mockUserRepository, mockPasswordService);

    await expect(
      useCase.execute({
        userId: 1n,
        currentPassword: 'OldPassword123!',
        newPassword: 'short',
      }),
    ).rejects.toThrow('al menos 12 caracteres');
  });

  it('falla si la nueva contraseña es idéntica a la actual', async () => {
    const mockUserRepository = { findById: vi.fn() } as unknown as UserRepository;
    const mockPasswordService = { compare: vi.fn(), hash: vi.fn() } as unknown as PasswordService;

    const useCase = new ChangePasswordUseCase(mockUserRepository, mockPasswordService);

    await expect(
      useCase.execute({
        userId: 1n,
        currentPassword: 'SamePassword123!',
        newPassword: 'SamePassword123!',
      }),
    ).rejects.toThrow('diferente de la actual');
  });

  it('falla si la contraseña actual es incorrecta', async () => {
    const mockUserRepository = {
      findById: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UserRepository;

    const mockPasswordService = {
      compare: vi.fn().mockResolvedValue(false),
    } as unknown as PasswordService;

    const mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;

    const useCase = new ChangePasswordUseCase(
      mockUserRepository,
      mockPasswordService,
      mockAuditService,
    );

    await expect(
      useCase.execute({
        userId: 1n,
        currentPassword: 'WrongPassword!',
        newPassword: 'NewSecurePassword2026!',
      }),
    ).rejects.toThrow('Contraseña actual incorrecta');

    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.password.change.failed',
      }),
    );
  });
});
