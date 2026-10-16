/**
 * DictionaryController Integration Tests
 * Sprint 3 - Dictionary API
 * Tests de integración para endpoints públicos del diccionario
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetHomeSlotsUseCase } from '../../../application/use-cases/dictionary/GetHomeSlotsUseCase.js';
import type { GetSemanticFieldsUseCase } from '../../../application/use-cases/dictionary/GetSemanticFieldsUseCase.js';
import type { GetWordByIdUseCase } from '../../../application/use-cases/dictionary/GetWordByIdUseCase.js';
import type { SearchWordsUseCase } from '../../../application/use-cases/dictionary/SearchWordsUseCase.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { DictionaryController } from './DictionaryController.js';

describe('DictionaryController Integration Tests', () => {
  let app: FastifyInstance;
  let mockSearchWordsExecute: ReturnType<typeof vi.fn>;
  let mockGetWordByIdExecuteModelo1: ReturnType<typeof vi.fn>;
  let mockGetWordByIdExecuteModelo2: ReturnType<typeof vi.fn>;
  let mockGetSemanticFieldsExecute: ReturnType<typeof vi.fn>;
  let mockGetSemanticFieldsExecuteById: ReturnType<typeof vi.fn>;
  let mockGetHomeSlotsExecute: ReturnType<typeof vi.fn>;

  // ========== MOCK DATA ==========

  const mockPaginatedResult = {
    data: [
      {
        id: BigInt(1),
        namtrikTermino: 'misak',
        espanolTermino: 'gente',
        namtrikDescripcion: 'Pueblo originario',
        espanolDescripcion: 'Pueblo indígena del Cauca',
        microcampos: [
          {
            microcampoId: BigInt(10),
            microcampo: {
              id: BigInt(10),
              namtrikTermino: 'identidad',
              espanolTermino: 'identidad',
              subcampoSemanticoId: BigInt(5),
            },
          },
        ],
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
  };

  const mockWordModelo1 = {
    id: BigInt(1),
    namtrikTermino: 'misak',
    espanolTermino: 'gente',
    namtrikDescripcion: 'Pueblo originario',
    espanolDescripcion: 'Pueblo indígena del Cauca',
    namtrikAudio: null,
    espanolAudio: null,
    imagen: null,
    microcampos: [
      {
        microcampoId: BigInt(10),
        microcampo: {
          id: BigInt(10),
          namtrikTermino: 'identidad',
          espanolTermino: 'identidad',
          subcampoSemanticoId: BigInt(5),
          subcampoSemantico: {
            id: BigInt(5),
            namtrikTermino: 'cultura',
            espanolTermino: 'cultura',
            campoSemanticoId: BigInt(2),
            campoSemantico: {
              id: BigInt(2),
              namtrikTermino: 'sociedad',
              espanolTermino: 'sociedad',
            },
          },
        },
      },
    ],
  };

  const mockWordModelo2 = {
    id: BigInt(2),
    namtrikTermino: 'ñimak',
    espanolTermino: '¿Cómo estás?',
    microcampos: [
      {
        microcampoId: BigInt(10),
        microcampo: {
          id: BigInt(10),
          namtrikTermino: 'saludos',
          espanolTermino: 'saludos',
          subcampoSemanticoId: BigInt(5),
          subcampoSemantico: {
            id: BigInt(5),
            namtrikTermino: 'convivencia',
            espanolTermino: 'convivencia',
            campoSemanticoId: BigInt(2),
            campoSemantico: {
              id: BigInt(2),
              namtrikTermino: 'sociedad',
              espanolTermino: 'sociedad',
            },
          },
        },
      },
    ],
  };

  const mockSemanticFieldsHierarchy = [
    {
      id: BigInt(1),
      namtrikTermino: 'naturaleza',
      espanolTermino: 'naturaleza',
      subcampos: [
        {
          id: BigInt(10),
          namtrikTermino: 'animales',
          espanolTermino: 'animales',
          microcampos: [
            {
              id: BigInt(100),
              namtrikTermino: 'aves',
              espanolTermino: 'aves',
            },
          ],
        },
      ],
    },
  ];

  const mockSingleSemanticField = {
    id: BigInt(1),
    namtrikTermino: 'naturaleza',
    espanolTermino: 'naturaleza',
    subcampos: [
      {
        id: BigInt(10),
        namtrikTermino: 'animales',
        espanolTermino: 'animales',
      },
    ],
  };

  beforeEach(async () => {
    // 1. Crear funciones mock
    mockSearchWordsExecute = vi.fn();
    mockGetWordByIdExecuteModelo1 = vi.fn();
    mockGetWordByIdExecuteModelo2 = vi.fn();
    mockGetSemanticFieldsExecute = vi.fn();
    mockGetSemanticFieldsExecuteById = vi.fn();
    mockGetHomeSlotsExecute = vi.fn();

    // 2. Crear mock use cases
    const mockSearchWordsUseCase = {
      execute: mockSearchWordsExecute,
    } as unknown as SearchWordsUseCase;
    const mockGetWordByIdUseCase = {
      executeModelo1: mockGetWordByIdExecuteModelo1,
      executeModelo2: mockGetWordByIdExecuteModelo2,
    } as unknown as GetWordByIdUseCase;
    const mockGetSemanticFieldsUseCase = {
      execute: mockGetSemanticFieldsExecute,
      executeById: mockGetSemanticFieldsExecuteById,
    } as unknown as GetSemanticFieldsUseCase;
    const mockGetHomeSlotsUseCase = {
      execute: mockGetHomeSlotsExecute,
    } as unknown as GetHomeSlotsUseCase;

    // 3. Crear controller con use cases mockeados
    const controller = new DictionaryController(
      mockSearchWordsUseCase,
      mockGetWordByIdUseCase,
      mockGetSemanticFieldsUseCase,
      mockGetHomeSlotsUseCase,
    );

    // 4. Crear instancia Fastify y registrar rutas manualmente
    app = Fastify({ logger: false });
    app.get('/words/search', controller.searchWords.bind(controller));
    app.get('/words/modelo1/:id', controller.getWordModelo1ById.bind(controller));
    app.get('/words/modelo2/:id', controller.getWordModelo2ById.bind(controller));
    app.get('/semantic-fields', controller.getSemanticFields.bind(controller));
    app.get('/semantic-fields/:id', controller.getSemanticFieldById.bind(controller));
    app.get('/home-slots', controller.getHomeSlots.bind(controller));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  // ========== GET /words/search ==========

  describe('GET /words/search', () => {
    it('debería retornar resultados paginados con BigInt serializado', async () => {
      // Arrange
      mockSearchWordsExecute.mockResolvedValue(mockPaginatedResult);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/words/search',
        query: { q: 'misak', page: '1', limit: '20' },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toBeDefined();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe('1');
      expect(body.data[0].namtrikTermino).toBe('misak');
      expect(body.data[0].microcampos[0].microcampoId).toBe('10');
      expect(body.data[0].microcampos[0].microcampo.id).toBe('10');
      expect(body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('debería pasar los query params correctamente al use case', async () => {
      // Arrange
      mockSearchWordsExecute.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      // Act
      await app.inject({
        method: 'GET',
        url: '/words/search',
        query: {
          q: 'agua',
          microcampoId: '5',
          page: '2',
          limit: '10',
          orderBy: 'espanol',
        },
      });

      // Assert
      expect(mockSearchWordsExecute).toHaveBeenCalledTimes(1);
      const callArgs = mockSearchWordsExecute.mock.calls[0][0];
      expect(callArgs.query).toBe('agua');
      expect(callArgs.microcampoId).toBe(BigInt(5));
      expect(callArgs.page).toBe(2);
      expect(callArgs.limit).toBe(10);
      expect(callArgs.orderBy).toBe('espanol');
    });

    it('debería manejar AppError del use case correctamente', async () => {
      // Arrange
      mockSearchWordsExecute.mockRejectedValue(
        new AppError('Parámetros de búsqueda inválidos', 400),
      );

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/words/search',
        query: { q: 'misak' },
      });

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Parámetros de búsqueda inválidos');
    });

    it('debería retornar 500 ante errores inesperados', async () => {
      // Arrange
      mockSearchWordsExecute.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/words/search',
        query: { q: 'misak' },
      });

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Error interno del servidor');
    });
  });

  // ========== GET /words/modelo1/:id ==========

  describe('GET /words/modelo1/:id', () => {
    it('debería retornar palabra Modelo 1 con BigInt serializado', async () => {
      // Arrange
      mockGetWordByIdExecuteModelo1.mockResolvedValue(mockWordModelo1);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/words/modelo1/1',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('1');
      expect(body.namtrikTermino).toBe('misak');
      expect(body.microcampos[0].microcampoId).toBe('10');
      expect(body.microcampos[0].microcampo.id).toBe('10');
      expect(body.microcampos[0].microcampo.subcampoSemanticoId).toBe('5');
      expect(body.microcampos[0].microcampo.subcampoSemantico.id).toBe('5');
      expect(body.microcampos[0].microcampo.subcampoSemantico.campoSemanticoId).toBe('2');
      expect(body.microcampos[0].microcampo.subcampoSemantico.campoSemantico.id).toBe('2');
    });

    it('debería manejar AppError 404 cuando la palabra no existe', async () => {
      // Arrange
      mockGetWordByIdExecuteModelo1.mockRejectedValue(new AppError('Palabra no encontrada', 404));

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/words/modelo1/999',
      });

      // Assert
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Palabra no encontrada');
    });

    it('debería retornar 500 ante error inesperado', async () => {
      // Arrange
      mockGetWordByIdExecuteModelo1.mockRejectedValue(new Error('Connection lost'));

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/words/modelo1/1',
      });

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Error interno del servidor');
    });
  });

  // ========== GET /words/modelo2/:id ==========

  describe('GET /words/modelo2/:id', () => {
    it('debería retornar palabra Modelo 2 con BigInt serializado', async () => {
      // Arrange
      mockGetWordByIdExecuteModelo2.mockResolvedValue(mockWordModelo2);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/words/modelo2/2',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('2');
      expect(body.namtrikTermino).toBe('ñimak');
      expect(body.microcampos[0].microcampoId).toBe('10');
      expect(body.microcampos[0].microcampo.subcampoSemantico.campoSemantico.id).toBe('2');
    });
  });

  // ========== GET /semantic-fields ==========

  describe('GET /semantic-fields', () => {
    it('debería retornar jerarquía semántica serializada', async () => {
      // Arrange
      mockGetSemanticFieldsExecute.mockResolvedValue(mockSemanticFieldsHierarchy);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/semantic-fields',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe('1');
      expect(body[0].namtrikTermino).toBe('naturaleza');
      expect(body[0].subcampos[0].id).toBe('10');
      expect(body[0].subcampos[0].microcampos[0].id).toBe('100');
    });

    it('debería retornar 500 ante error inesperado', async () => {
      // Arrange
      mockGetSemanticFieldsExecute.mockRejectedValue(new Error('Database timeout'));

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/semantic-fields',
      });

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Error interno del servidor');
    });
  });

  // ========== GET /semantic-fields/:id ==========

  describe('GET /semantic-fields/:id', () => {
    it('debería retornar 404 cuando el campo semántico no existe', async () => {
      // Arrange
      mockGetSemanticFieldsExecuteById.mockResolvedValue(null);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/semantic-fields/999',
      });

      // Assert
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campo semántico no encontrado');
    });

    it('debería retornar campo semántico serializado cuando existe', async () => {
      // Arrange
      mockGetSemanticFieldsExecuteById.mockResolvedValue(mockSingleSemanticField);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/semantic-fields/1',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('1');
      expect(body.namtrikTermino).toBe('naturaleza');
      expect(body.subcampos).toHaveLength(1);
      expect(body.subcampos[0].id).toBe('10');
    });
  });

  // ========== GET /home-slots ==========

  describe('GET /home-slots', () => {
    it('debería retornar 200 con los slots serializados correctamente', async () => {
      // Arrange
      const mockSlots = [
        {
          id: BigInt(1),
          clave: 'ya',
          etiqueta: 'Ya',
          posicion: 1,
          campo: {
            id: BigInt(10),
            codigo: 'C1',
            slug: 'ya',
            namtrikTermino: 'Ya',
            espanolTermino: 'La casa',
            espanolDescripcion: 'El hogar',
          },
        },
        {
          id: BigInt(5),
          clave: 'namui-nu-piro',
          etiqueta: 'Namui Nu Pirɵ',
          posicion: 5,
          campo: null,
        },
      ];
      mockGetHomeSlotsExecute.mockResolvedValue(mockSlots);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/home-slots',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
      expect(body[0].id).toBe('1');
      expect(body[0].clave).toBe('ya');
      expect(body[0].campo.id).toBe('10');
      expect(body[0].campo.codigo).toBe('C1');
      expect(body[1].id).toBe('5');
      expect(body[1].campo).toBeNull();
    });

    it('debería retornar 500 si el caso de uso falla', async () => {
      // Arrange
      mockGetHomeSlotsExecute.mockRejectedValue(new Error('DB error'));

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/home-slots',
      });

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Error interno del servidor');
    });
  });
});
