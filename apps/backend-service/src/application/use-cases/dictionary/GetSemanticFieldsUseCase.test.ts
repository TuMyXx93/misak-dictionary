/**
 * GetSemanticFieldsUseCase Tests
 * Sprint 3 - Dictionary API
 * Tests para obtener la jerarquía semántica completa
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CampoSemanticoRepository } from '../../../infrastructure/repositories/CampoSemanticoRepository.js';
import { GetSemanticFieldsUseCase } from './GetSemanticFieldsUseCase.js';

describe('GetSemanticFieldsUseCase', () => {
  let useCase: GetSemanticFieldsUseCase;
  let mockCampoSemanticoRepository: CampoSemanticoRepository;

  const mockHierarchy = [
    {
      id: BigInt(1),
      namtrikTermino: 'Naturaleza',
      espanolTermino: 'Naturaleza',
      subcampos: [
        {
          id: BigInt(10),
          namtrikTermino: 'Animales',
          espanolTermino: 'Animales',
          microcampos: [{ id: BigInt(100), namtrikTermino: 'Aves', espanolTermino: 'Aves' }],
        },
      ],
    },
  ];

  const mockSingleField = {
    id: BigInt(1),
    namtrikTermino: 'Naturaleza',
    espanolTermino: 'Naturaleza',
    subcampos: [],
  };

  beforeEach(() => {
    mockCampoSemanticoRepository = {
      findAllWithHierarchy: vi.fn(),
      findByIdWithHierarchy: vi.fn(),
      findAll: vi.fn(),
    } as unknown as CampoSemanticoRepository;

    useCase = new GetSemanticFieldsUseCase(mockCampoSemanticoRepository);
  });

  // ========== execute ==========

  describe('execute', () => {
    it('deberia delegar a findAllWithHierarchy y retornar la jerarquía completa', async () => {
      // Arrange
      vi.mocked(mockCampoSemanticoRepository.findAllWithHierarchy).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        mockHierarchy as any,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(mockHierarchy);
      expect(mockCampoSemanticoRepository.findAllWithHierarchy).toHaveBeenCalledTimes(1);
    });
  });

  // ========== executeById ==========

  describe('executeById', () => {
    it('deberia delegar a findByIdWithHierarchy y retornar el campo específico', async () => {
      // Arrange
      vi.mocked(mockCampoSemanticoRepository.findByIdWithHierarchy).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test no necesita forma Prisma completa
        mockSingleField as any,
      );

      // Act
      const result = await useCase.executeById(BigInt(1));

      // Assert
      expect(result).toEqual(mockSingleField);
      expect(mockCampoSemanticoRepository.findByIdWithHierarchy).toHaveBeenCalledWith(BigInt(1));
      expect(mockCampoSemanticoRepository.findByIdWithHierarchy).toHaveBeenCalledTimes(1);
    });
  });
});
