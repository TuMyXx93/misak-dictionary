/**
 * @module GetAuthMeUseCase.test
 * @description Pruebas unitarias para GetAuthMeUseCase (R-003).
 */

import { describe, expect, it, vi } from 'vitest';
import type { PermissionRepository } from '../../../infrastructure/repositories/PermissionRepository.js';
import type { UserRepository } from '../../../infrastructure/repositories/UserRepository.js';
import { GetAuthMeUseCase } from './GetAuthMeUseCase.js';

describe('GetAuthMeUseCase', () => {
  it('retorna la información del usuario con roles y permisos resueltos en servidor', async () => {
    const mockUser = {
      id: 12n,
      username: 'namtrik_user',
      email: 'namtrik@misak.org',
      fullName: 'Namtrik Lingüista',
      isActive: true,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      roles: [
        { roleId: 1n, role: { id: 1n, name: 'cultural_reviewer' } },
        { roleId: 2n, role: { id: 2n, name: 'analytics_viewer' } },
      ],
    };

    const mockUserRepository = {
      findByIdWithRoles: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UserRepository;

    const mockPermissionRepository = {
      findPermissionNamesForUser: vi
        .fn()
        .mockResolvedValue(['dictionary:read', 'taxonomy:ratify', 'audit:read']),
    } as unknown as PermissionRepository;

    const useCase = new GetAuthMeUseCase(mockUserRepository, mockPermissionRepository);

    const result = await useCase.execute({ userId: 12n });

    expect(result).toEqual({
      userId: '12',
      username: 'namtrik_user',
      email: 'namtrik@misak.org',
      fullName: 'Namtrik Lingüista',
      mustChangePassword: true,
      roles: ['cultural_reviewer', 'analytics_viewer'],
      permissions: ['dictionary:read', 'taxonomy:ratify', 'audit:read'],
    });

    expect(mockUserRepository.findByIdWithRoles).toHaveBeenCalledWith(12n);
    expect(mockPermissionRepository.findPermissionNamesForUser).toHaveBeenCalledWith(12n);
  });

  it('lanza error si el usuario no existe', async () => {
    const mockUserRepository = {
      findByIdWithRoles: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository;

    const mockPermissionRepository = {
      findPermissionNamesForUser: vi.fn(),
    } as unknown as PermissionRepository;

    const useCase = new GetAuthMeUseCase(mockUserRepository, mockPermissionRepository);

    await expect(useCase.execute({ userId: 999n })).rejects.toThrow('User not found or inactive');
  });

  it('lanza error si el usuario está inactivo', async () => {
    const mockUser = {
      id: 14n,
      username: 'inactivo',
      email: 'inactivo@misak.org',
      fullName: 'Usuario Inactivo',
      isActive: false,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      roles: [],
    };

    const mockUserRepository = {
      findByIdWithRoles: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UserRepository;

    const mockPermissionRepository = {
      findPermissionNamesForUser: vi.fn(),
    } as unknown as PermissionRepository;

    const useCase = new GetAuthMeUseCase(mockUserRepository, mockPermissionRepository);

    await expect(useCase.execute({ userId: 14n })).rejects.toThrow('User not found or inactive');
  });
});
