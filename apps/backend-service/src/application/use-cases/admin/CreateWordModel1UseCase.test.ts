/**
 * CreateWordModel1UseCase Tests
 * Sprint 4 - Admin API
 * Tests para la creación de palabras Modelo 1
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/config/prisma.js', () => ({
  prisma: {
    palabraModelo1: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    palabraM1Microcampo: {
      createMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type { CreateWordModel1DTO } from '../../dtos/AdminDictionaryDto.js';
import { CreateWordModel1UseCase } from './CreateWordModel1UseCase.js';

describe('CreateWordModel1UseCase', () => {
  let useCase: CreateWordModel1UseCase;

  // ========== DATOS DE PRUEBA ==========

  const baseDTO: CreateWordModel1DTO = {
    namtrikTermino: 'misak',
    espanolTermino: 'gente del agua',
    namtrikDescripcion: 'Descripción en Namtrik',
    espanolDescripcion: 'Descripción en Español',
  };

  const createdWord = {
    id: BigInt(1),
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

  const createdWordWithRelations = {
    ...createdWord,
    microcampos: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    useCase = new CreateWordModel1UseCase();
  });

  // ========== CREACIÓN EXITOSA ==========

  describe('creación exitosa', () => {
    it('debería crear una palabra exitosamente con campos requeridos', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findFirst)
        .mockResolvedValueOnce(null) // 1. No existe por namtrik
        .mockResolvedValueOnce(null); // 2. No existe por español
      vi.mocked(prisma.palabraModelo1.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWord as any,
      );
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWordWithRelations as any,
      );

      // Act
      const result = await useCase.execute(baseDTO);

      // Assert
      expect(result).toEqual(createdWordWithRelations);
      expect(prisma.palabraModelo1.create).toHaveBeenCalledWith({
        data: {
          namtrikTermino: baseDTO.namtrikTermino,
          espanolTermino: baseDTO.espanolTermino,
          namtrikDescripcion: baseDTO.namtrikDescripcion,
          espanolDescripcion: baseDTO.espanolDescripcion,
        },
      });
    });

    it('debería crear una palabra con campos opcionales de audio e imagen', async () => {
      // Arrange
      const dtoWithOptionals: CreateWordModel1DTO = {
        ...baseDTO,
        namtrikAudio: 'https://example.com/audio-namtrik.mp3',
        espanolAudio: 'https://example.com/audio-espanol.mp3',
        imagen: 'https://example.com/imagen.png',
      };

      vi.mocked(prisma.palabraModelo1.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.palabraModelo1.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...createdWord, ...dtoWithOptionals } as any,
      );
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...createdWordWithRelations, ...dtoWithOptionals } as any,
      );

      // Act
      await useCase.execute(dtoWithOptionals);

      // Assert
      expect(prisma.palabraModelo1.create).toHaveBeenCalledWith({
        data: {
          namtrikTermino: dtoWithOptionals.namtrikTermino,
          espanolTermino: dtoWithOptionals.espanolTermino,
          namtrikDescripcion: dtoWithOptionals.namtrikDescripcion,
          espanolDescripcion: dtoWithOptionals.espanolDescripcion,
          namtrikAudio: 'https://example.com/audio-namtrik.mp3',
          espanolAudio: 'https://example.com/audio-espanol.mp3',
          imagen: 'https://example.com/imagen.png',
        },
      });
    });

    it('no debería incluir campos opcionales cuando no se proporcionan', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.palabraModelo1.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWord as any,
      );
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWordWithRelations as any,
      );

      // Act
      await useCase.execute(baseDTO);

      // Assert
      const createCall = vi.mocked(prisma.palabraModelo1.create).mock.calls[0]?.[0];
      expect(createCall?.data).not.toHaveProperty('namtrikAudio');
      expect(createCall?.data).not.toHaveProperty('espanolAudio');
      expect(createCall?.data).not.toHaveProperty('imagen');
    });
  });

  // ========== RELACIONES MICROCAMPOS ==========

  describe('relaciones microcampos', () => {
    it('debería crear relaciones de microcampos cuando se proporcionan microcamposIds', async () => {
      // Arrange
      const dtoWithMicrocampos: CreateWordModel1DTO = {
        ...baseDTO,
        microcamposIds: [BigInt(10), BigInt(20)],
      };

      vi.mocked(prisma.palabraModelo1.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.palabraModelo1.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWord as any,
      );
      vi.mocked(prisma.palabraM1Microcampo.createMany).mockResolvedValue({
        count: 2,
      });
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWordWithRelations as any,
      );

      // Act
      await useCase.execute(dtoWithMicrocampos);

      // Assert
      expect(prisma.palabraM1Microcampo.createMany).toHaveBeenCalledWith({
        data: [
          { palabraId: BigInt(1), microcampoId: BigInt(10) },
          { palabraId: BigInt(1), microcampoId: BigInt(20) },
        ],
      });
    });

    it('no debería crear relaciones de microcampos cuando microcamposIds está vacío', async () => {
      // Arrange
      const dtoWithEmptyMicrocampos: CreateWordModel1DTO = {
        ...baseDTO,
        microcamposIds: [],
      };

      vi.mocked(prisma.palabraModelo1.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.palabraModelo1.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWord as any,
      );
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWordWithRelations as any,
      );

      // Act
      await useCase.execute(dtoWithEmptyMicrocampos);

      // Assert
      expect(prisma.palabraM1Microcampo.createMany).not.toHaveBeenCalled();
    });
  });

  // ========== RETORNO CON RELACIONES ==========

  describe('retorno con relaciones', () => {
    it('debería retornar la palabra creada con sus relaciones incluidas', async () => {
      // Arrange
      const wordWithMicrocampos = {
        ...createdWord,
        microcampos: [
          {
            microcampo: {
              id: BigInt(10),
              namtrikTermino: 'Aves',
              espanolTermino: 'Birds',
            },
          },
        ],
      };

      vi.mocked(prisma.palabraModelo1.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.palabraModelo1.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWord as any,
      );
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        wordWithMicrocampos as any,
      );

      // Act
      const result = await useCase.execute(baseDTO);

      // Assert
      expect(result).toEqual(wordWithMicrocampos);
      expect(prisma.palabraModelo1.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
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

  // ========== ERRORES DE DUPLICADOS ==========

  describe('errores de duplicados', () => {
    it('debería lanzar AppError 409 cuando namtrikTermino ya existe', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findFirst).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWord as any,
      );

      // Act & Assert
      await expect(useCase.execute(baseDTO)).rejects.toThrow(AppError);
      await expect(useCase.execute(baseDTO)).rejects.toThrow(
        'Ya existe una palabra con este término en Namtrik',
      );
    });

    it('debería lanzar AppError 409 cuando espanolTermino ya existe', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findFirst)
        .mockResolvedValueOnce(null) // 1. No existe por namtrik
        .mockResolvedValueOnce(
          // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
          createdWord as any, // 2. Ya existe por español
        );

      // Act & Assert
      await expect(useCase.execute(baseDTO)).rejects.toThrow(AppError);
    });

    it('debería verificar statusCode 409 en el error de duplicado por namtrik', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findFirst).mockResolvedValueOnce(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        createdWord as any,
      );

      // Act & Assert
      try {
        await useCase.execute(baseDTO);
        expect.fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(409);
      }
    });
  });
});
