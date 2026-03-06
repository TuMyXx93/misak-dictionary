/**
 * postgres18-helpers Tests
 * Verifica funciones helper standalone y la clase PostgreSQL18Helper
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '../generated/prisma/client.js';
import {
  arrayToVector,
  calculateTextSimilarity,
  createPG18Helper,
  DEFAULT_SEARCH_CONFIG,
  normalizeText,
  PG18_FEATURES,
  PostgreSQL18Helper,
  sanitizeSearchQuery,
} from './postgres18-helpers.js';

// ========== FUNCIONES STANDALONE ==========

describe('sanitizeSearchQuery', () => {
  it('debería limpiar espacios y remover operadores booleanos', () => {
    // Arrange
    const input = '  hola & mundo | (test)  ';

    // Act
    const result = sanitizeSearchQuery(input);

    // Assert
    // 1. trim → 'hola & mundo | (test)'
    // 2. replace operadores → 'hola   mundo    test '
    // 3. normalizar espacios → 'hola mundo test '
    expect(result).toBe('hola mundo test ');
  });

  it('debería normalizar múltiples espacios consecutivos', () => {
    // Arrange
    const input = 'hola    mundo     test';

    // Act
    const result = sanitizeSearchQuery(input);

    // Assert
    expect(result).toBe('hola mundo test');
  });

  it('debería truncar a un máximo de 200 caracteres', () => {
    // Arrange
    const input = 'a'.repeat(300);

    // Act
    const result = sanitizeSearchQuery(input);

    // Assert
    expect(result.length).toBe(200);
  });
});

describe('arrayToVector', () => {
  it('debería formatear un array de embeddings al formato vector de PostgreSQL', () => {
    // Arrange
    const embedding = [0.1, 0.2, 0.3, 0.4];

    // Act
    const result = arrayToVector(embedding);

    // Assert
    expect(result).toBe('[0.1,0.2,0.3,0.4]');
  });

  it('debería manejar un array vacío', () => {
    // Arrange
    const embedding: number[] = [];

    // Act
    const result = arrayToVector(embedding);

    // Assert
    expect(result).toBe('[]');
  });
});

describe('calculateTextSimilarity', () => {
  it('debería retornar 1 para cadenas idénticas', () => {
    // Arrange & Act
    const result = calculateTextSimilarity('hola', 'hola');

    // Assert
    expect(result).toBe(1);
  });

  it('debería retornar 0 para cadenas completamente diferentes', () => {
    // Arrange & Act
    const result = calculateTextSimilarity('abc', 'xyz');

    // Assert
    expect(result).toBe(0);
  });

  it('debería retornar un valor entre 0 y 1 para cadenas similares', () => {
    // Arrange & Act
    const result = calculateTextSimilarity('hola', 'hole');

    // Assert
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it('debería manejar cadenas vacías retornando 1', () => {
    // Arrange & Act
    const result = calculateTextSimilarity('', '');

    // Assert
    expect(result).toBe(1);
  });
});

describe('normalizeText', () => {
  it('debería convertir a minúsculas y remover acentos', () => {
    // Arrange
    const input = 'Ñandú Café Lingüística';

    // Act
    const result = normalizeText(input);

    // Assert
    expect(result).toBe('nandu cafe linguistica');
  });
});

describe('createPG18Helper', () => {
  it('debería retornar una instancia de PostgreSQL18Helper', () => {
    // Arrange
    // biome-ignore lint/suspicious/noExplicitAny: mock mínimo para test unitario
    const mockPrisma = {} as any as PrismaClient;

    // Act
    const helper = createPG18Helper(mockPrisma);

    // Assert
    expect(helper).toBeInstanceOf(PostgreSQL18Helper);
  });
});

// ========== CONSTANTES ==========

describe('PG18_FEATURES', () => {
  it('debería contener las claves de features esperadas', () => {
    // Assert
    expect(PG18_FEATURES).toHaveProperty('FULL_TEXT_SEARCH');
    expect(PG18_FEATURES).toHaveProperty('VECTOR_SIMILARITY');
    expect(PG18_FEATURES).toHaveProperty('TRIGRAM_SEARCH');
    expect(PG18_FEATURES).toHaveProperty('MATERIALIZED_VIEWS');
    expect(PG18_FEATURES).toHaveProperty('PARALLEL_QUERIES');
    expect(PG18_FEATURES).toHaveProperty('JSON_SCHEMA_VALIDATION');
  });
});

describe('DEFAULT_SEARCH_CONFIG', () => {
  it('debería tener los valores por defecto esperados', () => {
    // Assert
    expect(DEFAULT_SEARCH_CONFIG.idioma).toBe('spanish');
    expect(DEFAULT_SEARCH_CONFIG.limit).toBe(100);
    expect(DEFAULT_SEARCH_CONFIG.offset).toBe(0);
    expect(DEFAULT_SEARCH_CONFIG.similarityThreshold).toBe(0.3);
  });
});

// ========== CLASE PostgreSQL18Helper ==========

describe('PostgreSQL18Helper', () => {
  let helper: PostgreSQL18Helper;
  let mockPrisma: {
    $queryRaw: ReturnType<typeof vi.fn>;
    $executeRaw: ReturnType<typeof vi.fn>;
    $executeRawUnsafe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn(),
      $executeRawUnsafe: vi.fn(),
    };
    helper = new PostgreSQL18Helper(mockPrisma as unknown as PrismaClient);
  });

  describe('fullTextSearch', () => {
    it('debería llamar a $queryRaw y convertir relevancia a número', async () => {
      // Arrange
      const mockResults = [
        {
          id: BigInt(1),
          namtrikTermino: 'misak',
          espanolTermino: 'guambiano',
          relevancia: '0.75',
          tipoModelo: 'modelo_1',
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      // Act
      const results = await helper.fullTextSearch('misak', {
        idioma: 'spanish',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(1);
      expect(results[0]?.relevancia).toBe(0.75);
      expect(typeof results[0]?.relevancia).toBe('number');
    });
  });

  describe('fuzzySearch', () => {
    it('debería usar valores por defecto y convertir similarity a número', async () => {
      // Arrange
      const mockResults = [
        {
          id: BigInt(2),
          termino: 'ala',
          similarity: '0.6',
          tipo: 'modelo_1',
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      // Act
      const results = await helper.fuzzySearch('ala');

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(1);
      expect(results[0]?.similarity).toBe(0.6);
      expect(typeof results[0]?.similarity).toBe('number');
    });
  });

  describe('getCamposSemanticosStats', () => {
    it('debería retornar los resultados crudos de la vista materializada', async () => {
      // Arrange
      const mockStats = [
        {
          id: BigInt(1),
          namtrikTermino: 'Nu misak',
          espanolTermino: 'Pueblo Misak',
          totalSubcampos: 5,
          totalMicrocampos: 20,
          totalPalabras: 100,
          ultimaActualizacion: new Date('2025-01-01'),
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockStats);

      // Act
      const results = await helper.getCamposSemanticosStats();

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual(mockStats);
    });
  });

  describe('refreshMaterializedView', () => {
    it('debería ejecutar refresh concurrente por defecto', async () => {
      // Arrange
      mockPrisma.$executeRaw.mockResolvedValue(0);

      // Act
      await helper.refreshMaterializedView();

      // Assert
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('debería ejecutar refresh no concurrente cuando se indica', async () => {
      // Arrange
      mockPrisma.$executeRaw.mockResolvedValue(0);

      // Act
      await helper.refreshMaterializedView(false);

      // Assert
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('debería retornar el conteo de sesiones eliminadas', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ cleanup_expired_sessions: 5 }]);

      // Act
      const count = await helper.cleanupExpiredSessions();

      // Assert
      expect(count).toBe(5);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('vacuumAnalyze', () => {
    it('debería llamar a $executeRawUnsafe con el nombre de tabla', async () => {
      // Arrange
      mockPrisma.$executeRawUnsafe.mockResolvedValue(0);

      // Act
      await helper.vacuumAnalyze('usuarios');

      // Assert
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith('VACUUM ANALYZE usuarios');
    });

    it('debería llamar a $executeRaw sin nombre de tabla', async () => {
      // Arrange
      mockPrisma.$executeRaw.mockResolvedValue(0);

      // Act
      await helper.vacuumAnalyze();

      // Assert
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOldPasswordResets', () => {
    it('debería retornar el conteo de password resets eliminados', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ cleanup_old_password_resets: 3 }]);

      // Act
      const count = await helper.cleanupOldPasswordResets();

      // Assert
      expect(count).toBe(3);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('vectorSimilaritySearch', () => {
    it('debería ejecutar búsqueda vectorial con embedding y límite', async () => {
      // Arrange
      const mockResults = [{ placeholder: 1 }];
      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      // Act
      const results = await helper.vectorSimilaritySearch([0.1, 0.2, 0.3], 5);

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual(mockResults);
    });

    it('debería usar límite por defecto de 10', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act
      const results = await helper.vectorSimilaritySearch([0.5]);

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual([]);
    });
  });

  describe('getQueryPerformanceStats', () => {
    it('debería retornar estadísticas de performance de queries', async () => {
      // Arrange
      const mockStats = [
        {
          query: 'SELECT * FROM palabras',
          calls: 100,
          totalExecTime: 5000,
          meanExecTime: 50,
          maxExecTime: 200,
          stddevExecTime: 30,
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockStats);

      // Act
      const results = await helper.getQueryPerformanceStats(10);

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual(mockStats);
    });

    it('debería usar límite por defecto de 20', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act
      const results = await helper.getQueryPerformanceStats();

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual([]);
    });
  });

  describe('resetQueryStats', () => {
    it('debería ejecutar pg_stat_statements_reset', async () => {
      // Arrange
      mockPrisma.$executeRaw.mockResolvedValue(0);

      // Act
      await helper.resetQueryStats();

      // Assert
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('getIndexUsageStats', () => {
    it('debería retornar estadísticas de uso de índices', async () => {
      // Arrange
      const mockStats = [
        {
          schemaName: 'public',
          tableName: 'palabras_modelo_1',
          indexName: 'idx_palabras_termino',
          indexScans: 500,
          tuplesRead: 10000,
          tuplesFetched: 8000,
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockStats);

      // Act
      const results = await helper.getIndexUsageStats('public');

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual(mockStats);
    });

    it('debería usar schema por defecto "public"', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act
      const results = await helper.getIndexUsageStats();

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual([]);
    });
  });

  describe('getTableSizes', () => {
    it('debería retornar tamaños de tablas e índices', async () => {
      // Arrange
      const mockSizes = [
        {
          schemaName: 'public',
          tableName: 'palabras_modelo_1',
          totalSize: '128 MB',
          tableSize: '96 MB',
          indexesSize: '32 MB',
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockSizes);

      // Act
      const results = await helper.getTableSizes();

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual(mockSizes);
    });
  });

  describe('weightedSearch', () => {
    it('debería ejecutar búsqueda ponderada con pesos personalizados', async () => {
      // Arrange
      const mockResults = [
        {
          id: BigInt(1),
          namtrikTermino: 'misak',
          espanolTermino: 'guambiano',
          relevancia: 0.85,
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockResults);

      // Act
      const results = await helper.weightedSearch('misak', {
        termino: 0.8,
        descripcion: 0.2,
      });

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual(mockResults);
    });

    it('debería usar pesos por defecto si no se especifican', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // Act
      const results = await helper.weightedSearch('agua');

      // Assert
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(results).toEqual([]);
    });
  });
});
