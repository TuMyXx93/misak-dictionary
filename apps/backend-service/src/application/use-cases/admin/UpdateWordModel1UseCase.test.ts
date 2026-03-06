/**
 * UpdateWordModel1UseCase Tests
 * Sprint 4 - Admin API
 * Tests para la actualización de palabras Modelo 1
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/config/prisma.js', () => ({
  prisma: {
    palabraModelo1: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    palabraM1Microcampo: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { UpdateWordModel1DTO } from '../../dtos/AdminDictionaryDto.js';
import { UpdateWordModel1UseCase } from './UpdateWordModel1UseCase.js';

describe('UpdateWordModel1UseCase', () => {
  let useCase: UpdateWordModel1UseCase;

  // ========== DATOS DE PRUEBA ==========

  const wordId = BigInt(1);

  const existingWord = {
    id: wordId,
    namtrikTermino: 'misak',
    espanolTermino: 'gente del agua',
    namtrikDescripcion: 'Descripción en Namtrik',
    espanolDescripcion: 'Descripción en Español',
    namtrikAudio: null,
    espanolAudio: null,
    imagen: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const updatedWordWithRelations = {
    ...existingWord,
    namtrikTermino: 'misak-actualizado',
    microcampos: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    useCase = new UpdateWordModel1UseCase();
  });

  // ========== ACTUALIZACIÓN EXITOSA ==========

  describe('actualización exitosa', () => {
    it('debería actualizar una palabra exitosamente', async () => {
      // Arrange
      const updateData: UpdateWordModel1DTO = {
        namtrikTermino: 'misak-actualizado',
      };

      vi.mocked(prisma.palabraModelo1.findUnique)
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          existingWord as any,
        ) // 1. Buscar palabra existente
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          updatedWordWithRelations as any,
        ); // 2. Retornar palabra actualizada con relaciones
      vi.mocked(prisma.palabraModelo1.findFirst).mockResolvedValueOnce(null); // No hay duplicado
      vi.mocked(prisma.palabraModelo1.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        updatedWordWithRelations as any,
      );

      // Act
      const result = await useCase.execute(wordId, updateData);

      // Assert
      expect(result).toEqual(updatedWordWithRelations);
      expect(prisma.palabraModelo1.update).toHaveBeenCalledWith({
        where: { id: wordId },
        data: { namtrikTermino: 'misak-actualizado' },
      });
    });

    it('debería omitir verificación de unicidad cuando el término no cambia', async () => {
      // Arrange
      const updateData: UpdateWordModel1DTO = {
        namtrikTermino: 'misak', // Mismo valor que el existente
        espanolDescripcion: 'Nueva descripción',
      };

      vi.mocked(prisma.palabraModelo1.findUnique)
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          existingWord as any,
        )
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          { ...existingWord, microcampos: [] } as any,
        );
      vi.mocked(prisma.palabraModelo1.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        existingWord as any,
      );

      // Act
      await useCase.execute(wordId, updateData);

      // Assert — findFirst no debería ser llamado porque los términos no cambian
      expect(prisma.palabraModelo1.findFirst).not.toHaveBeenCalled();
    });
  });

  // ========== ERRORES DE VALIDACIÓN ==========

  describe('errores de validación', () => {
    it('debería lanzar AppError 404 cuando la palabra no existe', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValueOnce(null);

      // Act & Assert
      await expect(useCase.execute(BigInt(999), {})).rejects.toThrow(AppError);
      await expect(useCase.execute(BigInt(999), {})).rejects.toThrow('Palabra no encontrada');
    });

    it('debería lanzar AppError 404 cuando la palabra está eliminada (soft-delete)', async () => {
      // Arrange
      const softDeletedWord = { ...existingWord, deletedAt: new Date() };
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValueOnce(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        softDeletedWord as any,
      );

      // Act & Assert
      await expect(useCase.execute(wordId, {})).rejects.toThrow(AppError);
      await expect(useCase.execute(wordId, {})).rejects.toThrow('Palabra no encontrada');
    });

    it('debería verificar statusCode 404 cuando la palabra no existe', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValueOnce(null);

      // Act & Assert
      try {
        await useCase.execute(BigInt(999), {});
        expect.fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
      }
    });

    it('debería lanzar AppError 409 cuando el nuevo namtrikTermino ya existe', async () => {
      // Arrange
      const updateData: UpdateWordModel1DTO = {
        namtrikTermino: 'termino-duplicado',
      };

      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        existingWord as any,
      );
      vi.mocked(prisma.palabraModelo1.findFirst).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { id: BigInt(2), namtrikTermino: 'termino-duplicado' } as any,
      );

      // Act & Assert
      await expect(useCase.execute(wordId, updateData)).rejects.toThrow(AppError);
      await expect(useCase.execute(wordId, updateData)).rejects.toThrow(
        'Ya existe otra palabra con este término en Namtrik',
      );
    });

    it('debería lanzar AppError 409 cuando el nuevo espanolTermino ya existe', async () => {
      // Arrange
      const updateData: UpdateWordModel1DTO = {
        espanolTermino: 'termino-español-duplicado',
      };

      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        existingWord as any,
      );
      vi.mocked(prisma.palabraModelo1.findFirst).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { id: BigInt(3), espanolTermino: 'termino-español-duplicado' } as any,
      );

      // Act & Assert
      await expect(useCase.execute(wordId, updateData)).rejects.toThrow(AppError);
      await expect(useCase.execute(wordId, updateData)).rejects.toThrow(
        'Ya existe otra palabra con este término en Español',
      );
    });
  });

  // ========== RELACIONES MICROCAMPOS ==========

  describe('relaciones microcampos', () => {
    it('debería actualizar relaciones de microcampos cuando se proporcionan microcamposIds', async () => {
      // Arrange
      const updateData: UpdateWordModel1DTO = {
        microcamposIds: [BigInt(10), BigInt(20)],
      };

      vi.mocked(prisma.palabraModelo1.findUnique)
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          existingWord as any,
        )
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          updatedWordWithRelations as any,
        );
      vi.mocked(prisma.palabraModelo1.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        existingWord as any,
      );
      vi.mocked(prisma.palabraM1Microcampo.deleteMany).mockResolvedValue({
        count: 0,
      });
      vi.mocked(prisma.palabraM1Microcampo.createMany).mockResolvedValue({
        count: 2,
      });

      // Act
      await useCase.execute(wordId, updateData);

      // Assert
      expect(prisma.palabraM1Microcampo.deleteMany).toHaveBeenCalledWith({
        where: { palabraId: wordId },
      });
      expect(prisma.palabraM1Microcampo.createMany).toHaveBeenCalledWith({
        data: [
          { palabraId: wordId, microcampoId: BigInt(10) },
          { palabraId: wordId, microcampoId: BigInt(20) },
        ],
      });
    });

    it('debería retornar la palabra actualizada con relaciones incluidas', async () => {
      // Arrange
      const updateData: UpdateWordModel1DTO = {
        namtrikDescripcion: 'Nueva descripción',
      };

      vi.mocked(prisma.palabraModelo1.findUnique)
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          existingWord as any,
        )
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          updatedWordWithRelations as any,
        );
      vi.mocked(prisma.palabraModelo1.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        existingWord as any,
      );

      // Act
      const result = await useCase.execute(wordId, updateData);

      // Assert
      expect(result).toEqual(updatedWordWithRelations);
      expect(prisma.palabraModelo1.findUnique).toHaveBeenLastCalledWith({
        where: { id: wordId },
        include: {
          microcampos: {
            include: {
              microcampo: true,
            },
          },
        },
      });
    });
  });
});
