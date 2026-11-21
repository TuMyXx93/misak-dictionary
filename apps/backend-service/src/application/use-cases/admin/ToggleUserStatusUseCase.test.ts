import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ISessionRepository,
  IUserRepository,
} from '../../../domain/interfaces/IAuthServices.js';
import type { AuditService } from '../../../shared/audit/AuditService.js';
import { ToggleUserStatusUseCase } from './ToggleUserStatusUseCase.js';

describe('ToggleUserStatusUseCase', () => {
  let useCase: ToggleUserStatusUseCase;
  let mockUserRepository: {
    findByIdWithRoles: ReturnType<typeof vi.fn>;
    toggleActive: ReturnType<typeof vi.fn>;
    countSuperAdmins: ReturnType<typeof vi.fn>;
  };
  let mockSessionRepository: { revokeAllForUser: ReturnType<typeof vi.fn> };
  let mockAuditService: { record: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockUserRepository = {
      findByIdWithRoles: vi.fn(),
      toggleActive: vi.fn(),
      countSuperAdmins: vi.fn(),
    };
    mockSessionRepository = {
      revokeAllForUser: vi.fn().mockResolvedValue(2),
    };
    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ToggleUserStatusUseCase(
      mockUserRepository as unknown as IUserRepository,
      mockSessionRepository as unknown as ISessionRepository,
      mockAuditService as unknown as AuditService,
    );
  });

  it('impide auto-suspensión de cuenta (R-004)', async () => {
    await expect(
      useCase.execute({
        targetUserId: BigInt(1),
        isActive: false,
        actorUserId: BigInt(1),
        actorUsername: 'admin',
        actorRoles: ['admin'],
      }),
    ).rejects.toThrow('No es posible suspender su propia cuenta de usuario');
  });

  it('lanza 404 si el usuario objetivo no existe', async () => {
    mockUserRepository.findByIdWithRoles.mockResolvedValue(null);

    await expect(
      useCase.execute({
        targetUserId: BigInt(99),
        isActive: false,
        actorUserId: BigInt(1),
        actorUsername: 'admin',
        actorRoles: ['admin'],
      }),
    ).rejects.toThrow('Usuario no encontrado');
  });

  it('impide que un no super_admin suspenda a un super_admin', async () => {
    mockUserRepository.findByIdWithRoles.mockResolvedValue({
      id: BigInt(2),
      roles: [{ role: { name: 'super_admin' } }],
    });

    await expect(
      useCase.execute({
        targetUserId: BigInt(2),
        isActive: false,
        actorUserId: BigInt(1),
        actorUsername: 'admin',
        actorRoles: ['admin'],
      }),
    ).rejects.toThrow('Solo un superadministrador');
  });

  it('impide suspender al último super_admin del sistema', async () => {
    mockUserRepository.findByIdWithRoles.mockResolvedValue({
      id: BigInt(2),
      roles: [{ role: { name: 'super_admin' } }],
    });
    mockUserRepository.countSuperAdmins.mockResolvedValue(1);

    await expect(
      useCase.execute({
        targetUserId: BigInt(2),
        isActive: false,
        actorUserId: BigInt(1),
        actorUsername: 'root',
        actorRoles: ['super_admin'],
      }),
    ).rejects.toThrow('No es posible desactivar al último super_admin');
  });

  it('suspende usuario, revoca sesiones y audita motivo', async () => {
    const targetUser = {
      id: BigInt(5),
      roles: [{ role: { name: 'content_admin' } }],
    };
    mockUserRepository.findByIdWithRoles.mockResolvedValue(targetUser);
    mockUserRepository.toggleActive.mockResolvedValue({ ...targetUser, isActive: false });

    const result = await useCase.execute({
      targetUserId: BigInt(5),
      isActive: false,
      motivo: 'Inactividad prolongada',
      actorUserId: BigInt(1),
      actorUsername: 'admin',
      actorRoles: ['admin'],
    });

    expect(result.isActive).toBe(false);
    expect(mockSessionRepository.revokeAllForUser).toHaveBeenCalledWith(BigInt(5));
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.deactivate',
        newData: { isActive: false, motivo: 'Inactividad prolongada' },
      }),
    );
  });
});
