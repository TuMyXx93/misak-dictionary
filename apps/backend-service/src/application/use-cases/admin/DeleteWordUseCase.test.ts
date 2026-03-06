/**
 * DeleteWordUseCase Tests
 * Sprint 4 - Admin API
 * Tests para soft delete y restauración de palabras Modelo 1 y Modelo 2
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/config/prisma.js', () => ({
  prisma: {
    palabraModelo1: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    palabraModelo2: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { DeleteWordUseCase } from './DeleteWordUseCase.js';

describe('DeleteWordUseCase', () => {
  let useCase: DeleteWordUseCase;

  // ========== DATOS DE PRUEBA ==========

  const wordId = BigInt(1);

  const activeWordModelo1 = {
    id: wordId,
    namtrikTermino: 'misak',
    espanolTermino: 'gente del agua',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const deletedWordModelo1 = {
    ...activeWordModelo1,
    deletedAt: new Date('2025-01-01'),
  };

  const activeWordModelo2 = {
    id: wordId,
    namtrikTerminoPregunta: 'chi',
    espanolTraduccionPregunta: 'que',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const deletedWordModelo2 = {
    ...activeWordModelo2,
    deletedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    useCase = new DeleteWordUseCase();
  });

  // ========== deleteModelo1 ==========

  describe('deleteModelo1', () => {
    it('debería hacer soft-delete cuando la palabra existe y está activa', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        activeWordModelo1 as any,
      );
      vi.mocked(prisma.palabraModelo1.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        deletedWordModelo1 as any,
      );

      // Act
      const result = await useCase.deleteModelo1(wordId);

      // Assert
      expect(result).toEqual(deletedWordModelo1);
      expect(prisma.palabraModelo1.update).toHaveBeenCalledWith({
        where: { id: wordId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('debería lanzar AppError 404 cuando la palabra no existe', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.deleteModelo1(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.deleteModelo1(BigInt(999))).rejects.toThrow('Palabra no encontrada');
    });

    it('debería lanzar AppError 404 cuando la palabra ya fue eliminada', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        deletedWordModelo1 as any,
      );

      // Act & Assert
      await expect(useCase.deleteModelo1(wordId)).rejects.toThrow(AppError);
      await expect(useCase.deleteModelo1(wordId)).rejects.toThrow('Palabra no encontrada');
    });

    it('debería verificar statusCode 404 en el error', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(null);

      // Act & Assert
      try {
        await useCase.deleteModelo1(BigInt(999));
        expect.fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
      }
    });
  });

  // ========== deleteModelo2 ==========

  describe('deleteModelo2', () => {
    it('debería hacer soft-delete cuando la palabra Modelo 2 existe y está activa', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo2.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        activeWordModelo2 as any,
      );
      vi.mocked(prisma.palabraModelo2.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        deletedWordModelo2 as any,
      );

      // Act
      const result = await useCase.deleteModelo2(wordId);

      // Assert
      expect(result).toEqual(deletedWordModelo2);
      expect(prisma.palabraModelo2.update).toHaveBeenCalledWith({
        where: { id: wordId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('debería lanzar AppError 404 cuando la palabra Modelo 2 no existe', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo2.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.deleteModelo2(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.deleteModelo2(BigInt(999))).rejects.toThrow('Palabra no encontrada');
    });

    it('debería lanzar AppError 404 cuando la palabra Modelo 2 ya fue eliminada', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo2.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        deletedWordModelo2 as any,
      );

      // Act & Assert
      await expect(useCase.deleteModelo2(wordId)).rejects.toThrow(AppError);
      await expect(useCase.deleteModelo2(wordId)).rejects.toThrow('Palabra no encontrada');
    });
  });

  // ========== restoreModelo1 ==========

  describe('restoreModelo1', () => {
    it('debería restaurar una palabra eliminada de Modelo 1', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        deletedWordModelo1 as any,
      );
      vi.mocked(prisma.palabraModelo1.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        activeWordModelo1 as any,
      );

      // Act
      const result = await useCase.restoreModelo1(wordId);

      // Assert
      expect(result).toEqual(activeWordModelo1);
      expect(prisma.palabraModelo1.update).toHaveBeenCalledWith({
        where: { id: wordId },
        data: { deletedAt: null },
      });
    });

    it('debería lanzar AppError 404 cuando la palabra no existe para restaurar', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.restoreModelo1(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.restoreModelo1(BigInt(999))).rejects.toThrow('Palabra no encontrada');
    });

    it('debería lanzar AppError 400 cuando la palabra no está eliminada', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        activeWordModelo1 as any,
      );

      // Act & Assert
      await expect(useCase.restoreModelo1(wordId)).rejects.toThrow(AppError);
      await expect(useCase.restoreModelo1(wordId)).rejects.toThrow('La palabra no está eliminada');
    });

    it('debería verificar statusCode 400 cuando la palabra no está eliminada', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        activeWordModelo1 as any,
      );

      // Act & Assert
      try {
        await useCase.restoreModelo1(wordId);
        expect.fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
      }
    });
  });

  // ========== restoreModelo2 ==========

  describe('restoreModelo2', () => {
    it('debería restaurar una palabra eliminada de Modelo 2', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo2.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        deletedWordModelo2 as any,
      );
      vi.mocked(prisma.palabraModelo2.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        activeWordModelo2 as any,
      );

      // Act
      const result = await useCase.restoreModelo2(wordId);

      // Assert
      expect(result).toEqual(activeWordModelo2);
      expect(prisma.palabraModelo2.update).toHaveBeenCalledWith({
        where: { id: wordId },
        data: { deletedAt: null },
      });
    });

    it('debería lanzar AppError 404 cuando la palabra Modelo 2 no existe para restaurar', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo2.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.restoreModelo2(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.restoreModelo2(BigInt(999))).rejects.toThrow('Palabra no encontrada');
    });

    it('debería lanzar AppError 400 cuando la palabra Modelo 2 no está eliminada', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo2.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        activeWordModelo2 as any,
      );

      // Act & Assert
      await expect(useCase.restoreModelo2(wordId)).rejects.toThrow(AppError);
      await expect(useCase.restoreModelo2(wordId)).rejects.toThrow('La palabra no está eliminada');
    });
  });
});
