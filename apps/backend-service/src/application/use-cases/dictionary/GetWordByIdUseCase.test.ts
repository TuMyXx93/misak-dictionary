/**
 * GetWordByIdUseCase Tests
 * Spec 003 — Dictionary API
 * Tests para obtener una palabra por ID en Modelo 1 y Modelo 2
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PalabraRepository } from '../../../infrastructure/repositories/PalabraRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { GetWordByIdUseCase } from './GetWordByIdUseCase.js';

describe('GetWordByIdUseCase', () => {
  let useCase: GetWordByIdUseCase;
  let mockPalabraRepository: PalabraRepository;

  // Mock genérico para el resultado de una palabra — la forma exacta depende
  // del modelo Prisma, pero el use case solo delega y verifica nullidad
  const mockModelo1Word = {
    id: BigInt(1),
    namtrikTermino: 'misak',
    espanolTermino: 'gente del agua',
    microcampos: [],
  };

  const mockModelo2Word = {
    id: BigInt(1),
    namtrikTerminoPregunta: 'chi',
    espanolTraduccionPregunta: 'que',
    microcampos: [],
  };

  beforeEach(() => {
    mockPalabraRepository = {
      findModelo1ById: vi.fn(),
      findModelo2ById: vi.fn(),
      searchModelo1: vi.fn(),
    } as unknown as PalabraRepository;

    useCase = new GetWordByIdUseCase(mockPalabraRepository);
  });

  // ========== executeModelo1 ==========

  describe('executeModelo1', () => {
    it('deberia retornar la palabra cuando existe en Modelo 1', async () => {
      // Arrange
      vi.mocked(mockPalabraRepository.findModelo1ById).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        mockModelo1Word as any,
      );

      // Act
      const result = await useCase.executeModelo1(BigInt(1));

      // Assert
      expect(result).toEqual(mockModelo1Word);
      expect(mockPalabraRepository.findModelo1ById).toHaveBeenCalledWith(BigInt(1));
      expect(mockPalabraRepository.findModelo1ById).toHaveBeenCalledTimes(1);
    });

    it('deberia lanzar AppError 404 cuando la palabra no existe en Modelo 1', async () => {
      // Arrange
      vi.mocked(mockPalabraRepository.findModelo1ById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.executeModelo1(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.executeModelo1(BigInt(999))).rejects.toThrow('Palabra no encontrada');
    });
  });

  // ========== executeModelo2 ==========

  describe('executeModelo2', () => {
    it('deberia retornar la palabra cuando existe en Modelo 2', async () => {
      // Arrange
      vi.mocked(mockPalabraRepository.findModelo2ById).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        mockModelo2Word as any,
      );

      // Act
      const result = await useCase.executeModelo2(BigInt(1));

      // Assert
      expect(result).toEqual(mockModelo2Word);
      expect(mockPalabraRepository.findModelo2ById).toHaveBeenCalledWith(BigInt(1));
      expect(mockPalabraRepository.findModelo2ById).toHaveBeenCalledTimes(1);
    });

    it('deberia lanzar AppError 404 cuando la palabra no existe en Modelo 2', async () => {
      // Arrange
      vi.mocked(mockPalabraRepository.findModelo2ById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.executeModelo2(BigInt(999))).rejects.toThrow(AppError);
      await expect(useCase.executeModelo2(BigInt(999))).rejects.toThrow('Palabra no encontrada');
    });
  });
});
