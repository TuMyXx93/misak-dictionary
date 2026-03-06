/**
 * SearchWordsUseCase Tests
 * Sprint 3 - Dictionary API
 * Tests para búsqueda de palabras con filtros y paginación
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  PaginatedResult,
  PalabraRepository,
  RawWordResult,
} from '../../../infrastructure/repositories/PalabraRepository.js';
import { SearchWordsUseCase } from './SearchWordsUseCase.js';

describe('SearchWordsUseCase', () => {
  let useCase: SearchWordsUseCase;
  let mockPalabraRepository: PalabraRepository;

  const mockPaginatedResult: PaginatedResult<RawWordResult> = {
    data: [
      {
        id: BigInt(1),
        namtrik_termino: 'misak',
        espanol_termino: 'gente del agua',
        namtrik_descripcion: 'Pueblo originario',
        espanol_descripcion: 'Pueblo indígena del Cauca',
        namtrik_audio: null,
        espanol_audio: null,
        imagen: null,
      },
      {
        id: BigInt(2),
        namtrik_termino: 'nu',
        espanol_termino: 'casa',
        namtrik_descripcion: null,
        espanol_descripcion: 'Vivienda',
        namtrik_audio: null,
        espanol_audio: null,
        imagen: null,
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    mockPalabraRepository = {
      findModelo1ById: vi.fn(),
      findModelo2ById: vi.fn(),
      searchModelo1: vi.fn(),
    } as unknown as PalabraRepository;

    useCase = new SearchWordsUseCase(mockPalabraRepository);
  });

  describe('execute', () => {
    it('deberia delegar la búsqueda al repositorio y retornar resultado paginado', async () => {
      // Arrange
      vi.mocked(mockPalabraRepository.searchModelo1).mockResolvedValue(mockPaginatedResult);
      const params = { query: 'misak', page: 1, limit: 20 };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result).toEqual(mockPaginatedResult);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockPalabraRepository.searchModelo1).toHaveBeenCalledWith(params);
      expect(mockPalabraRepository.searchModelo1).toHaveBeenCalledTimes(1);
    });

    it('deberia retornar resultado vacío cuando no hay coincidencias', async () => {
      // Arrange
      const emptyResult: PaginatedResult<RawWordResult> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      vi.mocked(mockPalabraRepository.searchModelo1).mockResolvedValue(emptyResult);
      const params = { query: 'inexistente' };

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(mockPalabraRepository.searchModelo1).toHaveBeenCalledWith(params);
    });
  });
});
