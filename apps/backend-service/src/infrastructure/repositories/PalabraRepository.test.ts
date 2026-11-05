/**
 * PalabraRepository Tests
 * Sprint 3 - Dictionary API
 * Tests para el repositorio de palabras con búsqueda full-text y Prisma mockeado
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../shared/config/prisma.js', () => ({
  prisma: {
    palabraModelo1: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    palabraModelo2: {
      findUnique: vi.fn(),
    },
    sentidoLexico: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    systemSetting: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '../../shared/config/prisma.js';
import {
  buildSearchExcerpt,
  escapePostgresRegex,
  normalizeNamtrikEsQuery,
  PalabraRepository,
} from './PalabraRepository.js';

describe('PalabraRepository', () => {
  let repository: PalabraRepository;

  // ========== FIXTURES ==========
  const mockRawWord = {
    id: BigInt(1),
    namtrik_termino: 'ñimku',
    espanol_termino: 'tierra',
    namtrik_descripcion: 'Descripción en namtrik',
    espanol_descripcion: 'Descripción en español',
    namtrik_audio: 'audio1.mp3',
    espanol_audio: 'audio2.mp3',
    imagen: 'image1.jpg',
  };

  const mockPrismaWord = {
    id: BigInt(1),
    namtrikTermino: 'ñimku',
    espanolTermino: 'tierra',
    namtrikDescripcion: 'Descripción en namtrik',
    espanolDescripcion: 'Descripción en español',
    namtrikAudio: 'audio1.mp3',
    espanolAudio: 'audio2.mp3',
    imagen: 'image1.jpg',
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    microcampos: [
      {
        microcampo: {
          id: BigInt(10),
          namtrikTermino: 'microcampo1',
          subcampoSemantico: {
            id: BigInt(5),
            namtrikTermino: 'subcampo1',
            campoSemantico: {
              id: BigInt(2),
              namtrikTermino: 'campo1',
            },
          },
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    repository = new PalabraRepository();
  });

  // ========== searchModelo1 ==========
  describe('searchModelo1', () => {
    it('debería usar $queryRaw para búsqueda full-text cuando se proporciona query', async () => {
      // Arrange
      const mockWords = [mockRawWord];
      const mockCount = [{ count: BigInt(1) }];
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce(mockWords).mockResolvedValueOnce(mockCount);

      // Act
      const result = await repository.searchModelo1({
        query: 'tierra',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.data).toEqual(mockWords);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('debería usar Prisma findMany cuando no se proporciona query', async () => {
      // Arrange
      const mockWords = [mockPrismaWord];
      vi.mocked(prisma.palabraModelo1.findMany).mockResolvedValue(mockWords);
      vi.mocked(prisma.palabraModelo1.count).mockResolvedValue(1);

      // Act
      const result = await repository.searchModelo1({ page: 1, limit: 20 });

      // Assert
      expect(result.data).toEqual(mockWords);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.palabraModelo1.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        include: { microcampos: { include: { microcampo: true } } },
        orderBy: { namtrikTermino: 'asc' },
      });
      expect(prisma.palabraModelo1.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('debería aplicar paginación por defecto (page=1, limit=20)', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findMany).mockResolvedValue([]);
      vi.mocked(prisma.palabraModelo1.count).mockResolvedValue(0);

      // Act
      const result = await repository.searchModelo1({});

      // Assert
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
      expect(prisma.palabraModelo1.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('debería filtrar por microcampoId cuando se proporciona', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findMany).mockResolvedValue([]);
      vi.mocked(prisma.palabraModelo1.count).mockResolvedValue(0);

      // Act
      await repository.searchModelo1({ microcampoId: BigInt(5) });

      // Assert
      expect(prisma.palabraModelo1.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            microcampos: { some: { microcampoId: BigInt(5) } },
          },
        }),
      );
    });
  });

  // ========== fallback sobre sentidoLexico y modo dual (R-026) ==========
  describe('búsqueda de fallback sobre sentidoLexico y modo dual (R-026)', () => {
    const mockSentido = {
      id: BigInt(42),
      codigo: 'C1.SENT.42',
      estado: 'borrador',
      espanolGlosa: 'montaña',
      espanolExplicacion: 'elevación natural',
      namtrikContexto: 'contexto',
      nombreCientifico: null,
      formas: [{ orden: 1, lema: 'Urrɵ' }],
      ubicaciones: [
        {
          microcampo: {
            id: BigInt(10),
            slug: 'montana',
            namtrikTermino: 'Urrɵ',
            subcampoSemantico: {
              id: BigInt(5),
              slug: 'geografia',
              namtrikTermino: 'Geografía',
              campoSemantico: {
                id: BigInt(1),
                slug: 'naturaleza',
                namtrikTermino: 'Naturaleza',
              },
            },
          },
        },
      ],
    };

    it('busca en sentidoLexico cuando palabras_modelo_1 devuelve 0 y proyecta codigo y estado', async () => {
      // Arrange: $queryRaw devuelve 0 palabras
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);
      // biome-ignore lint/suspicious/noExplicitAny: mock Prisma
      vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([mockSentido] as any);
      vi.mocked(prisma.sentidoLexico.count).mockResolvedValue(1);

      // Act
      const result = await repository.searchModelo1({ query: 'montaña', page: 1, limit: 10 });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe(BigInt(42));
      expect(result.data[0]?.codigo).toBe('C1.SENT.42');
      expect(result.data[0]?.estado).toBe('borrador');
      expect(result.data[0]?.namtrik_termino).toBe('Urrɵ');
      expect(result.data[0]?.namtrikTermino).toBe('Urrɵ');
      expect(result.data[0]?.espanolTermino).toBe('montaña');
      expect(result.data[0]?.ubicacion?.ruta).toBe('/campos/naturaleza/geografia/montana#term-42');
      expect(result.data[0]?.medios).toEqual([]);

      const whereSentidos = vi.mocked(prisma.sentidoLexico.findMany).mock.calls[0]?.[0]?.where;
      expect(whereSentidos?.deletedAt).toBeNull();
      expect(whereSentidos?.estado).toBeUndefined(); // Modo inclusivo por defecto
    });

    it('cuando PUBLIC_ONLY_RATIFIED es true, el fallback filtra solo estado ratificado', async () => {
      // Arrange
      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        id: BigInt(1),
        key: 'PUBLIC_ONLY_RATIFIED',
        value: true,
        updatedAt: new Date(),
        updatedBy: BigInt(1),
      });
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);
      vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([]);
      vi.mocked(prisma.sentidoLexico.count).mockResolvedValue(0);

      // Act
      await repository.searchModelo1({ query: 'montaña' });

      // Assert
      const whereSentidos = vi.mocked(prisma.sentidoLexico.findMany).mock.calls[0]?.[0]?.where;
      expect(whereSentidos?.deletedAt).toBeNull();
      expect(whereSentidos?.estado).toBe('ratificado');
    });

    it('proyecta campoCoincidencia y extractoCoincidencia cuando $queryRaw devuelve sentidos ranqueados (Enmienda 0.4.0)', async () => {
      // Arrange: palabras_modelo_1 devuelve 0 y la consulta ranqueada de sentidos_lexicos devuelve 3 filas (niveles 1, 5, 7)
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([
          {
            sentido_id: BigInt(961),
            best_nivel: 1,
            max_sim: 1,
            max_sim_lema: 1,
            max_sim_glosa: 0,
            total_count: BigInt(3),
          },
          {
            sentido_id: BigInt(1203),
            best_nivel: 5,
            max_sim: 0.45,
            max_sim_lema: 0,
            max_sim_glosa: 0.45,
            total_count: BigInt(3),
          },
          {
            sentido_id: BigInt(90),
            best_nivel: 7,
            max_sim: 0.1,
            max_sim_lema: 0,
            max_sim_glosa: 0.1,
            total_count: BigInt(3),
          },
        ]);

      vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([
        {
          ...mockSentido,
          id: BigInt(961),
          codigo: 'C6.S5.E028',
          espanolGlosa: 'Flor',
          espanolExplicacion: 'Órgano reproductor de las plantas.',
          formas: [{ orden: 1, lema: 'Ú', categoriaGramatical: 'n.' }],
        },
        {
          ...mockSentido,
          id: BigInt(1203),
          codigo: 'C7.S2.E023',
          espanolGlosa: 'Nuestro mundo',
          espanolExplicacion: 'Territorio ancestral.',
          formas: [{ orden: 1, lema: 'Kɵrɵishik', categoriaGramatical: 'n.' }],
        },
        {
          ...mockSentido,
          id: BigInt(90),
          codigo: 'C1.S3.E013',
          espanolGlosa: 'Representación de la estrella',
          espanolExplicacion:
            'El rombo tejido en el sombrero representa los cuatro puntos cardinales del mundo y el cosmos Misak.',
          formas: [{ orden: 1, lema: 'Kɵnchapik', categoriaGramatical: 'n.' }],
        },
        // biome-ignore lint/suspicious/noExplicitAny: mock Prisma
      ] as any);

      // Act
      const result = await repository.searchModelo1({ query: 'mundo', page: 1, limit: 10 });

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.data[0]?.id).toBe(BigInt(961));
      expect(result.data[0]?.coincidencia).toBe('exacta');
      expect(result.data[0]?.campoCoincidencia).toBe('lema');
      expect(result.data[0]?.extractoCoincidencia).toBeNull();

      expect(result.data[1]?.id).toBe(BigInt(1203));
      expect(result.data[1]?.coincidencia).toBe('aproximada');
      expect(result.data[1]?.campoCoincidencia).toBe('glosa');
      expect(result.data[1]?.extractoCoincidencia).toBeNull();

      expect(result.data[2]?.id).toBe(BigInt(90));
      expect(result.data[2]?.coincidencia).toBe('aproximada');
      expect(result.data[2]?.campoCoincidencia).toBe('explicacion');
      expect(result.data[2]?.extractoCoincidencia).toContain('mundo');
    });

    it('no cae al fallback ILIKE no ranqueado cuando la consulta SQL ranqueada se ejecuta y devuelve 0 filas', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([]);

      const result = await repository.searchModelo1({ query: 'z', page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(prisma.sentidoLexico.findMany).not.toHaveBeenCalled();
    });
  });

  // ========== Matriz de Equivalencias Bilingüe y Búsqueda Híbrida RRF (Spec 012 / ADR-0008) ==========
  describe('matriz de equivalencias y búsqueda híbrida RRF (Spec 012 / ADR-0008)', () => {
    it('proyecta campoCoincidencia: "equivalencia", terminoEquivalente y rrfScore cuando proviene de la matriz', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([
          {
            sentido_id: BigInt(745),
            best_nivel: 5,
            match_source: 'equivalencia',
            termino_equivalente: 'estrella',
            max_peso_eq: 0.95,
            max_sim: 0.8,
            max_sim_lema: 0,
            max_sim_glosa: 0.3,
            max_sim_eq: 1.0,
            rrf_score: 0.0408,
            total_count: BigInt(1),
          },
        ]);

      vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([
        {
          id: BigInt(745),
          codigo: 'C1.S3.E013',
          estado: 'ratificado',
          espanolGlosa: 'Representación de la estrella',
          espanolExplicacion: 'Figura geométrica.',
          namtrikContexto: null,
          formas: [{ orden: 1, lema: 'Kɵnchapik', categoriaGramatical: 'n.' }],
          ubicaciones: [],
          medios: [],
        },
        // biome-ignore lint/suspicious/noExplicitAny: mock
      ] as any);

      const result = await repository.searchModelo1({ query: 'estrella', page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe(BigInt(745));
      expect(result.data[0]?.campoCoincidencia).toBe('equivalencia');
      expect(result.data[0]?.terminoEquivalente).toBe('estrella');
      expect(result.data[0]?.rrfScore).toBeCloseTo(0.0408);
      expect(result.data[0]?.coincidencia).toBe('aproximada');
    });

    it('activa el cortocircuito modelo1EmptyVerified cuando palabras_modelo_1 está vacía', async () => {
      vi.mocked(prisma.palabraModelo1.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([]);

      expect(repository.isModelo1EmptyVerified).toBe(false);

      await repository.searchModelo1({ query: 'flor', page: 1, limit: 10 });

      expect(repository.isModelo1EmptyVerified).toBe(true);

      // Segunda búsqueda: no debe consultar palabras_modelo_1 (1 llamada para sentidos_lexicos + 1 para taxonomía multinivel)
      vi.mocked(prisma.$queryRaw).mockClear();
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await repository.searchModelo1({ query: 'mundo', page: 1, limit: 10 });

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('admite inyección de ISemanticEmbeddingProvider y mantiene NullEmbeddingProvider por defecto', async () => {
      const defaultRepo = new PalabraRepository();
      expect(defaultRepo).toBeDefined();

      const customProvider = {
        dimensions: 384,
        isEnabled: () => true,
        embedQuery: vi.fn().mockResolvedValue([0.1, 0.2]),
      };

      const customRepo = new PalabraRepository(prisma, undefined, customProvider);
      expect(customRepo).toBeDefined();
    });

    it('proyecta nodos de taxonomía (campo, subcampo, microcampo, subnivel) cuando coinciden con la consulta', async () => {
      // Mock palabras_modelo_1 vacía
      vi.mocked(prisma.palabraModelo1.findFirst).mockResolvedValue(null);
      // Mock sentidos sin resultados
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([]) // palabras_modelo_1
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([]) // sentidos_lexicos
        .mockResolvedValueOnce([
          // taxonomy_nodes
          {
            tipo_resultado: 'microcampo',
            nivel_jerarquico: 3,
            id: BigInt(7),
            codigo: 'C1.S1.M1',
            slug: 'wammera',
            namtrik_termino: 'Wammera',
            espanol_termino: 'Lengua y memoria ancestral',
            namtrik_descripcion: null,
            espanol_descripcion: null,
            imagen: null,
            campo_slug: 'ya',
            campo_nombre: 'Ya',
            subcampo_slug: 'nakchak',
            subcampo_nombre: 'Nakchak',
            microcampo_slug: 'wammera',
            microcampo_nombre: 'Wammera',
            ruta: '/campos/ya/nakchak/wammera',
            total_terminos: 7,
            match_level: 1,
          },
        ]);

      const result = await repository.searchModelo1({ query: 'wammera', page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      const micro = result.data[0];
      expect(micro?.tipoResultado).toBe('microcampo');
      expect(micro?.nivelJerarquico).toBe(3);
      expect(micro?.namtrikTermino).toBe('Wammera');
      expect(micro?.totalTerminos).toBe(7);
      expect(micro?.campoCoincidencia).toBe('taxonomia');
      expect(micro?.ubicacion?.ruta).toBe('/campos/ya/nakchak/wammera');
    });

    it('proyecta nombreCientifico y campoCoincidencia "cientifico" cuando coincide con la consulta', async () => {
      vi.mocked(prisma.palabraModelo1.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([
          {
            sentido_id: BigInt(1351),
            best_nivel: 1,
            match_source: 'cientifico',
            termino_equivalente: null,
            max_peso_eq: 0,
            max_sim: 1,
            max_sim_lema: 0,
            max_sim_glosa: 0,
            max_sim_eq: 0,
            rrf_score: 0.025,
            total_count: BigInt(1),
          },
        ])
        .mockResolvedValueOnce([]); // 0 taxonomy rows

      vi.mocked(prisma.sentidoLexico.findMany).mockResolvedValue([
        {
          id: BigInt(1351),
          codigo: 'C4.S6.E021',
          estado: 'ratificado',
          espanolGlosa: 'Caracol (Gastropoda)',
          espanolExplicacion: null,
          namtrikContexto: null,
          nombreCientifico: 'Gastropoda',
          formas: [{ lema: 'Milu kalik', categoriaGramatical: 'sustantivo', medios: [] }],
          medios: [],
          ubicaciones: [],
        } as unknown as NonNullable<
          Awaited<ReturnType<typeof prisma.sentidoLexico.findMany>>[number]
        >,
      ]);

      const result = await repository.searchModelo1({ query: 'Gastropoda', page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      const term = result.data[0];
      expect(term?.tipoResultado).toBe('termino');
      expect(term?.nivelJerarquico).toBe(5);
      expect(term?.nombreCientifico).toBe('Gastropoda');
      expect(term?.campoCoincidencia).toBe('cientifico');
    });
  });

  // ========== Utilidades de normalización, escape Regex POSIX y extracto (Enmienda 0.4.0) ==========
  describe('utilidades de búsqueda bilingüe (Enmienda 0.4.0)', () => {
    it('normalizeNamtrikEsQuery normaliza tildes y variantes del grafema ɵ a "o"', () => {
      expect(normalizeNamtrikEsQuery('  Ú  ')).toBe('u');
      expect(normalizeNamtrikEsQuery('Kɵnchapik')).toBe('konchapik');
      expect(normalizeNamtrikEsQuery('Køsak')).toBe('kosak');
      expect(normalizeNamtrikEsQuery('K∅sak')).toBe('kosak');
      expect(normalizeNamtrikEsQuery('Munásrɵ?')).toBe('munasro?');
    });

    it('escapePostgresRegex escapa todos los metacaracteres POSIX ERE sin romper consultas con paréntesis o signos', () => {
      expect(escapePostgresRegex('pura(')).toBe('pura\\(');
      expect(escapePostgresRegex('munasro?')).toBe('munasro\\?');
      expect(escapePostgresRegex('a+b*c.[d]^$')).toBe('a\\+b\\*c\\.\\[d\\]\\^\\$');
    });

    it('buildSearchExcerpt genera un extracto centrado con puntos suspensivos alrededor de la coincidencia', () => {
      const longText =
        'En la cosmovisión del pueblo Misak el tejido del sombrero tradicional incorpora múltiples símbolos ancestrales donde el centro representa el equilibrio del mundo y la relación armónica con la naturaleza y el páramo.';
      const excerpt = buildSearchExcerpt(longText, 'mundo', 80);

      expect(excerpt).not.toBeNull();
      expect(excerpt).toContain('mundo');
      expect(excerpt?.startsWith('…')).toBe(true);
      expect(excerpt?.endsWith('…')).toBe(true);
      expect(buildSearchExcerpt(null, 'mundo')).toBeNull();
      expect(buildSearchExcerpt('   ', 'mundo')).toBeNull();
    });
  });

  // ========== findModelo1ById ==========
  describe('findModelo1ById', () => {
    it('debería retornar la palabra con sus relaciones incluidas', async () => {
      // Arrange
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados profundos
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(mockPrismaWord as any);

      // Act
      const result = await repository.findModelo1ById(BigInt(1));

      // Assert
      expect(result).toEqual(mockPrismaWord);
      expect(prisma.palabraModelo1.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: {
          microcampos: {
            include: {
              microcampo: {
                include: {
                  subcampoSemantico: {
                    include: {
                      campoSemantico: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('debería retornar null cuando la palabra no existe', async () => {
      // Arrange
      vi.mocked(prisma.palabraModelo1.findUnique).mockResolvedValue(null);

      // Act
      const result = await repository.findModelo1ById(BigInt(999));

      // Assert
      expect(result).toBeNull();
    });
  });

  // ========== findModelo2ById ==========
  describe('findModelo2ById', () => {
    it('debería retornar la palabra modelo 2 con sus relaciones incluidas', async () => {
      // Arrange
      const mockModelo2Word = {
        ...mockPrismaWord,
        id: BigInt(100),
      };
      // biome-ignore lint/suspicious/noExplicitAny: mock de Prisma con includes anidados profundos
      vi.mocked(prisma.palabraModelo2.findUnique).mockResolvedValue(mockModelo2Word as any);

      // Act
      const result = await repository.findModelo2ById(BigInt(100));

      // Assert
      expect(result).toEqual(mockModelo2Word);
      expect(prisma.palabraModelo2.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(100) },
        include: {
          microcampos: {
            include: {
              microcampo: {
                include: {
                  subcampoSemantico: {
                    include: {
                      campoSemantico: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });
  });
});
