/**
 * ManageSemanticFieldsUseCase Tests
 * Sprint 4 - Admin API
 * Tests para CRUD de campos semánticos, subcampos y microcampos
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/config/prisma.js', () => ({
  prisma: {
    campoSemantico: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    subcampoSemantico: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    microcampo: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../../../shared/config/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import type {
  CreateCampoSemanticoDTO,
  CreateMicrocampoDTO,
  CreateSubcampoSemanticoDTO,
  UpdateCampoSemanticoDTO,
  UpdateMicrocampoDTO,
  UpdateSubcampoSemanticoDTO,
} from '../../dtos/AdminDictionaryDto.js';
import { ManageSemanticFieldsUseCase } from './ManageSemanticFieldsUseCase.js';

describe('ManageSemanticFieldsUseCase', () => {
  let useCase: ManageSemanticFieldsUseCase;

  // ========== DATOS DE PRUEBA ==========

  const fieldId = BigInt(1);
  const parentId = BigInt(10);

  const baseCampoSemantico = {
    id: fieldId,
    namtrikTermino: 'Naturaleza',
    espanolTermino: 'Nature',
    namtrikDescripcion: 'Descripción Namtrik',
    espanolDescripcion: 'Descripción Español',
    namtrikAudio: null,
    espanolAudio: null,
    imagen: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseSubcampo = {
    id: fieldId,
    campoSemanticoId: parentId,
    namtrikTermino: 'Animales',
    espanolTermino: 'Animals',
    namtrikDescripcion: 'Descripción Namtrik',
    espanolDescripcion: 'Descripción Español',
    namtrikAudio: null,
    espanolAudio: null,
    imagen: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseMicrocampo = {
    id: fieldId,
    subcampoSemanticoId: parentId,
    namtrikTermino: 'Aves',
    espanolTermino: 'Birds',
    namtrikDescripcion: 'Descripción Namtrik',
    espanolDescripcion: 'Descripción Español',
    namtrikAudio: null,
    espanolAudio: null,
    imagen: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    useCase = new ManageSemanticFieldsUseCase();
  });

  // ========== CAMPO SEMÁNTICO ==========

  describe('createCampoSemantico', () => {
    const createDTO: CreateCampoSemanticoDTO = {
      namtrikTermino: 'Naturaleza',
      espanolTermino: 'Nature',
      namtrikDescripcion: 'Descripción Namtrik',
      espanolDescripcion: 'Descripción Español',
    };

    it('debería crear un campo semántico exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.campoSemantico.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseCampoSemantico as any,
      );

      // Act
      const result = await useCase.createCampoSemantico(createDTO);

      // Assert
      expect(result).toEqual(baseCampoSemantico);
      expect(prisma.campoSemantico.create).toHaveBeenCalledWith({
        data: {
          namtrikTermino: createDTO.namtrikTermino,
          espanolTermino: createDTO.espanolTermino,
          namtrikDescripcion: createDTO.namtrikDescripcion,
          espanolDescripcion: createDTO.espanolDescripcion,
        },
      });
    });

    it('debería lanzar AppError 409 cuando ya existe un campo con el mismo término', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findFirst).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseCampoSemantico as any,
      );

      // Act & Assert
      await expect(useCase.createCampoSemantico(createDTO)).rejects.toThrow(AppError);
      await expect(useCase.createCampoSemantico(createDTO)).rejects.toThrow(
        'Ya existe un campo semántico con este término',
      );
    });

    it('debería verificar statusCode 409 en conflicto de campo semántico', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findFirst).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseCampoSemantico as any,
      );

      // Act & Assert
      try {
        await useCase.createCampoSemantico(createDTO);
        expect.fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(409);
      }
    });
  });

  describe('updateCampoSemantico', () => {
    const updateDTO: UpdateCampoSemanticoDTO = {
      namtrikTermino: 'Naturaleza-actualizado',
    };

    it('debería actualizar un campo semántico exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseCampoSemantico as any,
      );
      vi.mocked(prisma.campoSemantico.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseCampoSemantico, ...updateDTO } as any,
      );

      // Act
      const result = await useCase.updateCampoSemantico(fieldId, updateDTO);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.campoSemantico.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: { namtrikTermino: 'Naturaleza-actualizado' },
      });
    });

    it('debería lanzar AppError 404 cuando el campo semántico no existe', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.updateCampoSemantico(BigInt(999), updateDTO)).rejects.toThrow(AppError);
      await expect(useCase.updateCampoSemantico(BigInt(999), updateDTO)).rejects.toThrow(
        'Campo semántico no encontrado',
      );
    });

    it('debería lanzar AppError 404 cuando el campo semántico está eliminado', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseCampoSemantico, deletedAt: new Date() } as any,
      );

      // Act & Assert
      await expect(useCase.updateCampoSemantico(fieldId, updateDTO)).rejects.toThrow(AppError);
      await expect(useCase.updateCampoSemantico(fieldId, updateDTO)).rejects.toThrow(
        'Campo semántico no encontrado',
      );
    });
  });

  describe('deleteCampoSemantico', () => {
    it('debería hacer soft-delete de un campo semántico exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseCampoSemantico as any,
      );
      vi.mocked(prisma.campoSemantico.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseCampoSemantico, deletedAt: new Date() } as any,
      );

      // Act
      const result = await useCase.deleteCampoSemantico(fieldId);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.campoSemantico.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('debería lanzar AppError 404 cuando el campo semántico no existe para eliminar', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.deleteCampoSemantico(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.deleteCampoSemantico(BigInt(999))).rejects.toThrow(
        'Campo semántico no encontrado',
      );
    });
  });

  // ========== SUBCAMPO SEMÁNTICO ==========

  describe('createSubcampoSemantico', () => {
    const createSubcampoDTO: CreateSubcampoSemanticoDTO = {
      campoSemanticoId: parentId,
      namtrikTermino: 'Animales',
      espanolTermino: 'Animals',
      namtrikDescripcion: 'Descripción Namtrik',
      espanolDescripcion: 'Descripción Español',
    };

    it('debería crear un subcampo semántico exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseCampoSemantico as any,
      );
      vi.mocked(prisma.subcampoSemantico.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.subcampoSemantico.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseSubcampo as any,
      );

      // Act
      const result = await useCase.createSubcampoSemantico(createSubcampoDTO);

      // Assert
      expect(result).toEqual(baseSubcampo);
      expect(prisma.subcampoSemantico.create).toHaveBeenCalledWith({
        data: {
          campoSemanticoId: createSubcampoDTO.campoSemanticoId,
          namtrikTermino: createSubcampoDTO.namtrikTermino,
          espanolTermino: createSubcampoDTO.espanolTermino,
          namtrikDescripcion: createSubcampoDTO.namtrikDescripcion,
          espanolDescripcion: createSubcampoDTO.espanolDescripcion,
        },
      });
    });

    it('debería lanzar AppError 404 cuando el campo semántico padre no existe', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.createSubcampoSemantico(createSubcampoDTO)).rejects.toThrow(AppError);
      await expect(useCase.createSubcampoSemantico(createSubcampoDTO)).rejects.toThrow(
        'Campo semántico padre no encontrado',
      );
    });

    it('debería lanzar AppError 404 cuando el campo semántico padre está eliminado', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseCampoSemantico, deletedAt: new Date() } as any,
      );

      // Act & Assert
      await expect(useCase.createSubcampoSemantico(createSubcampoDTO)).rejects.toThrow(AppError);
      await expect(useCase.createSubcampoSemantico(createSubcampoDTO)).rejects.toThrow(
        'Campo semántico padre no encontrado',
      );
    });

    it('debería lanzar AppError 409 cuando ya existe un subcampo con el mismo término en el campo padre', async () => {
      // Arrange
      vi.mocked(prisma.campoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseCampoSemantico as any,
      );
      vi.mocked(prisma.subcampoSemantico.findFirst).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseSubcampo as any,
      );

      // Act & Assert
      await expect(useCase.createSubcampoSemantico(createSubcampoDTO)).rejects.toThrow(AppError);
      await expect(useCase.createSubcampoSemantico(createSubcampoDTO)).rejects.toThrow(
        'Ya existe un subcampo con este término en el campo padre',
      );
    });
  });

  describe('updateSubcampoSemantico', () => {
    const updateSubcampoDTO: UpdateSubcampoSemanticoDTO = {
      namtrikTermino: 'Animales-actualizado',
    };

    it('debería actualizar un subcampo semántico exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseSubcampo as any,
      );
      vi.mocked(prisma.subcampoSemantico.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseSubcampo, ...updateSubcampoDTO } as any,
      );

      // Act
      const result = await useCase.updateSubcampoSemantico(fieldId, updateSubcampoDTO);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.subcampoSemantico.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: { namtrikTermino: 'Animales-actualizado' },
      });
    });

    it('debería lanzar AppError 404 cuando el subcampo no existe', async () => {
      // Arrange
      vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.updateSubcampoSemantico(BigInt(999), updateSubcampoDTO)).rejects.toThrow(
        AppError,
      );
      await expect(useCase.updateSubcampoSemantico(BigInt(999), updateSubcampoDTO)).rejects.toThrow(
        'Subcampo semántico no encontrado',
      );
    });
  });

  describe('deleteSubcampoSemantico', () => {
    it('debería hacer soft-delete de un subcampo semántico exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseSubcampo as any,
      );
      vi.mocked(prisma.subcampoSemantico.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseSubcampo, deletedAt: new Date() } as any,
      );

      // Act
      const result = await useCase.deleteSubcampoSemantico(fieldId);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.subcampoSemantico.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('debería lanzar AppError 404 cuando el subcampo no existe para eliminar', async () => {
      // Arrange
      vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.deleteSubcampoSemantico(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.deleteSubcampoSemantico(BigInt(999))).rejects.toThrow(
        'Subcampo semántico no encontrado',
      );
    });
  });

  // ========== MICROCAMPO ==========

  describe('createMicrocampo', () => {
    const createMicrocampoDTO: CreateMicrocampoDTO = {
      subcampoSemanticoId: parentId,
      namtrikTermino: 'Aves',
      espanolTermino: 'Birds',
      namtrikDescripcion: 'Descripción Namtrik',
      espanolDescripcion: 'Descripción Español',
    };

    it('debería crear un microcampo exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseSubcampo as any,
      );
      vi.mocked(prisma.microcampo.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.microcampo.create).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseMicrocampo as any,
      );

      // Act
      const result = await useCase.createMicrocampo(createMicrocampoDTO);

      // Assert
      expect(result).toEqual(baseMicrocampo);
      expect(prisma.microcampo.create).toHaveBeenCalledWith({
        data: {
          subcampoSemanticoId: createMicrocampoDTO.subcampoSemanticoId,
          namtrikTermino: createMicrocampoDTO.namtrikTermino,
          espanolTermino: createMicrocampoDTO.espanolTermino,
          namtrikDescripcion: createMicrocampoDTO.namtrikDescripcion,
          espanolDescripcion: createMicrocampoDTO.espanolDescripcion,
        },
      });
    });

    it('debería lanzar AppError 404 cuando el subcampo padre no existe', async () => {
      // Arrange
      vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.createMicrocampo(createMicrocampoDTO)).rejects.toThrow(AppError);
      await expect(useCase.createMicrocampo(createMicrocampoDTO)).rejects.toThrow(
        'Subcampo semántico padre no encontrado',
      );
    });

    it('debería lanzar AppError 404 cuando el subcampo padre está eliminado', async () => {
      // Arrange
      vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseSubcampo, deletedAt: new Date() } as any,
      );

      // Act & Assert
      await expect(useCase.createMicrocampo(createMicrocampoDTO)).rejects.toThrow(AppError);
      await expect(useCase.createMicrocampo(createMicrocampoDTO)).rejects.toThrow(
        'Subcampo semántico padre no encontrado',
      );
    });

    it('debería lanzar AppError 409 cuando ya existe un microcampo con el mismo término en el subcampo padre', async () => {
      // Arrange
      vi.mocked(prisma.subcampoSemantico.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseSubcampo as any,
      );
      vi.mocked(prisma.microcampo.findFirst).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseMicrocampo as any,
      );

      // Act & Assert
      await expect(useCase.createMicrocampo(createMicrocampoDTO)).rejects.toThrow(AppError);
      await expect(useCase.createMicrocampo(createMicrocampoDTO)).rejects.toThrow(
        'Ya existe un microcampo con este término en el subcampo padre',
      );
    });
  });

  describe('updateMicrocampo', () => {
    const updateMicrocampoDTO: UpdateMicrocampoDTO = {
      namtrikTermino: 'Aves-actualizado',
    };

    it('debería actualizar un microcampo exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.microcampo.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseMicrocampo as any,
      );
      vi.mocked(prisma.microcampo.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseMicrocampo, ...updateMicrocampoDTO } as any,
      );

      // Act
      const result = await useCase.updateMicrocampo(fieldId, updateMicrocampoDTO);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.microcampo.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: { namtrikTermino: 'Aves-actualizado' },
      });
    });

    it('debería lanzar AppError 404 cuando el microcampo no existe', async () => {
      // Arrange
      vi.mocked(prisma.microcampo.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.updateMicrocampo(BigInt(999), updateMicrocampoDTO)).rejects.toThrow(
        AppError,
      );
      await expect(useCase.updateMicrocampo(BigInt(999), updateMicrocampoDTO)).rejects.toThrow(
        'Microcampo no encontrado',
      );
    });
  });

  describe('deleteMicrocampo', () => {
    it('debería hacer soft-delete de un microcampo exitosamente', async () => {
      // Arrange
      vi.mocked(prisma.microcampo.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        baseMicrocampo as any,
      );
      vi.mocked(prisma.microcampo.update).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseMicrocampo, deletedAt: new Date() } as any,
      );

      // Act
      const result = await useCase.deleteMicrocampo(fieldId);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.microcampo.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('debería lanzar AppError 404 cuando el microcampo no existe para eliminar', async () => {
      // Arrange
      vi.mocked(prisma.microcampo.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.deleteMicrocampo(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.deleteMicrocampo(BigInt(999))).rejects.toThrow(
        'Microcampo no encontrado',
      );
    });

    it('debería lanzar AppError 404 cuando el microcampo ya fue eliminado', async () => {
      // Arrange
      vi.mocked(prisma.microcampo.findUnique).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        { ...baseMicrocampo, deletedAt: new Date() } as any,
      );

      // Act & Assert
      await expect(useCase.deleteMicrocampo(fieldId)).rejects.toThrow(AppError);
      await expect(useCase.deleteMicrocampo(fieldId)).rejects.toThrow('Microcampo no encontrado');
    });
  });
});
