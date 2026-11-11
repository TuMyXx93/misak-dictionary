/**
 * UserRepository Tests
 * Spec 002 — Auth System
 * Tests para el repositorio de usuarios con Prisma mockeado
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/config/prisma.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../../shared/config/prisma.js';
import { UserRepository } from './UserRepository.js';

describe('UserRepository', () => {
  let repository: UserRepository;

  // ========== FIXTURES ==========
  const mockUser = {
    id: BigInt(1),
    username: 'testuser',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    fullName: 'Test User',
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
  };

  const mockUserWithRolesRaw = {
    ...mockUser,
    userRoles: [
      {
        roleId: BigInt(1),
        role: { id: BigInt(1), name: 'admin' },
      },
      {
        roleId: BigInt(2),
        role: { id: BigInt(2), name: 'editor' },
      },
    ],
  };

  beforeEach(() => {
    repository = new UserRepository();
  });

  // ========== findByUsername ==========
  describe('findByUsername', () => {
    it('debería retornar el usuario cuando existe', async () => {
      // Arrange
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);

      // Act
      const result = await repository.findByUsername('testuser');

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          username: { equals: 'testuser', mode: 'insensitive' },
          deletedAt: null,
        },
      });
    });

    it('debería retornar null cuando el usuario no existe', async () => {
      // Arrange
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      // Act
      const result = await repository.findByUsername('nonexistent');

      // Assert
      expect(result).toBeNull();
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          username: { equals: 'nonexistent', mode: 'insensitive' },
          deletedAt: null,
        },
      });
    });
  });

  // ========== findByEmail ==========
  describe('findByEmail', () => {
    it('debería retornar el usuario cuando existe', async () => {
      // Arrange
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);

      // Act
      const result = await repository.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: 'test@example.com', mode: 'insensitive' },
          deletedAt: null,
        },
      });
    });

    it('debería retornar null cuando el email no existe', async () => {
      // Arrange
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail('missing@example.com');

      // Assert
      expect(result).toBeNull();
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: 'missing@example.com', mode: 'insensitive' },
          deletedAt: null,
        },
      });
    });
  });

  // ========== findByIdWithRoles ==========
  describe('findByIdWithRoles', () => {
    it('debería retornar el usuario con roles cuando existe', async () => {
      // Arrange
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithRolesRaw as any);

      // Act
      const result = await repository.findByIdWithRoles(BigInt(1));

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(BigInt(1));
      expect(result?.username).toBe('testuser');
      expect(result?.roles).toHaveLength(2);
      expect(result?.roles[0]).toEqual({
        roleId: BigInt(1),
        role: { id: BigInt(1), name: 'admin' },
      });
      expect(result?.roles[1]).toEqual({
        roleId: BigInt(2),
        role: { id: BigInt(2), name: 'editor' },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: { userRoles: { include: { role: true } } },
      });
    });

    it('debería retornar null cuando el usuario no existe', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findByIdWithRoles(BigInt(999));

      // Assert
      expect(result).toBeNull();
    });

    it('debería retornar null cuando el usuario está soft-deleted', async () => {
      // Arrange
      const softDeletedUser = {
        ...mockUserWithRolesRaw,
        deletedAt: new Date('2025-06-01'),
      };
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados
      vi.mocked(prisma.user.findUnique).mockResolvedValue(softDeletedUser as any);

      // Act
      const result = await repository.findByIdWithRoles(BigInt(1));

      // Assert
      expect(result).toBeNull();
    });
  });

  // ========== create ==========
  describe('create', () => {
    it('debería crear y retornar el usuario', async () => {
      // Arrange
      const createData = {
        username: 'newuser',
        email: 'new@example.com',
        password: '$2a$10$newhashedpassword',
        fullName: 'New User',
      };
      const createdUser = {
        ...mockUser,
        id: BigInt(2),
        username: createData.username,
        email: createData.email,
        password: createData.password,
        fullName: createData.fullName,
      };
      vi.mocked(prisma.user.create).mockResolvedValue(createdUser);

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: createData });
    });
  });

  describe('mustChangePassword operations', () => {
    it('debería actualizar contraseña y limpiar mustChangePassword', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser);

      await repository.updatePasswordAndClearMustChange(BigInt(1), 'newhash');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          password: 'newhash',
          mustChangePassword: false,
        },
      });
    });

    it('debería retornar el estado de mustChangePassword', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: select parcial
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ mustChangePassword: true } as any);

      const result = await repository.checkMustChangePassword(BigInt(1));

      expect(result).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        select: { mustChangePassword: true },
      });
    });
  });
});
