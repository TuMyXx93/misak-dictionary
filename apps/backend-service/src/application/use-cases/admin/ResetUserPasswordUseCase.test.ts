import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  IPasswordService,
  ISessionRepository,
  IUserRepository,
} from '../../../domain/interfaces/IAuthServices.js';
import {
  generateSecureTemporaryPassword,
  ResetUserPasswordUseCase,
} from './ResetUserPasswordUseCase.js';

describe('ResetUserPasswordUseCase', () => {
  let useCase: ResetUserPasswordUseCase;
  let mockUserRepository: any;
  let mockPasswordService: any;
  let mockSessionRepository: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockUserRepository = {
      findByIdWithRoles: vi.fn(),
      resetPasswordWithTemporary: vi.fn(),
    };
    mockPasswordService = {
      hash: vi.fn().mockResolvedValue('hashed-temp-password'),
    };
    mockSessionRepository = {
      revokeAllForUser: vi.fn().mockResolvedValue(1),
    };
    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ResetUserPasswordUseCase(
      mockUserRepository as IUserRepository,
      mockPasswordService as IPasswordService,
      mockSessionRepository as ISessionRepository,
      mockAuditService,
    );
  });

  it('generateSecureTemporaryPassword produce cadenas seguras de 14 caracteres', () => {
    const pwd = generateSecureTemporaryPassword();
    expect(pwd.length).toBe(14);
    expect(/[A-Z]/.test(pwd)).toBe(true);
    expect(/[a-z]/.test(pwd)).toBe(true);
    expect(/[0-9]/.test(pwd)).toBe(true);
  });

  it('lanza 404 si el usuario no existe', async () => {
    mockUserRepository.findByIdWithRoles.mockResolvedValue(null);

    await expect(
      useCase.execute({
        targetUserId: BigInt(99),
        actorUserId: BigInt(1),
        actorUsername: 'admin',
        actorRoles: ['admin'],
      }),
    ).rejects.toThrow('Usuario no encontrado');
  });

  it('impide que un no super_admin resetee la clave a un super_admin', async () => {
    mockUserRepository.findByIdWithRoles.mockResolvedValue({
      id: BigInt(2),
      roles: [{ role: { name: 'super_admin' } }],
    });

    await expect(
      useCase.execute({
        targetUserId: BigInt(2),
        actorUserId: BigInt(1),
        actorUsername: 'admin',
        actorRoles: ['admin'],
      }),
    ).rejects.toThrow('Solo un superadministrador');
  });

  it('resetea con clave temporal generada, revoca sesiones y marca mustChangePassword (R-005)', async () => {
    const targetUser = {
      id: BigInt(3),
      username: 'pepe',
      email: 'pepe@example.com',
      fullName: 'Pepe Perez',
      roles: [{ role: { name: 'content_admin' } }],
    };
    mockUserRepository.findByIdWithRoles.mockResolvedValue(targetUser);
    mockUserRepository.resetPasswordWithTemporary.mockResolvedValue(targetUser);

    const result = await useCase.execute({
      targetUserId: BigInt(3),
      actorUserId: BigInt(1),
      actorUsername: 'admin',
      actorRoles: ['admin'],
    });

    expect(result.mustChangePassword).toBe(true);
    expect(result.temporaryPassword.length).toBe(14);
    expect(mockPasswordService.hash).toHaveBeenCalledWith(result.temporaryPassword);
    expect(mockSessionRepository.revokeAllForUser).toHaveBeenCalledWith(BigInt(3));
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.password_reset',
        entityId: '3',
      }),
    );
  });
});
