/**
 * AdminDictionaryController Integration Tests
 * Sprint 4 - Admin API
 * Tests de integración para CRUD de diccionario (endpoints protegidos)
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateWordModel1UseCase } from '../../../application/use-cases/admin/CreateWordModel1UseCase.js';
import type { DeleteWordUseCase } from '../../../application/use-cases/admin/DeleteWordUseCase.js';
import type { ManageSemanticFieldsUseCase } from '../../../application/use-cases/admin/ManageSemanticFieldsUseCase.js';
import type { UpdateWordModel1UseCase } from '../../../application/use-cases/admin/UpdateWordModel1UseCase.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { AdminDictionaryController } from './AdminDictionaryController.js';

describe('AdminDictionaryController Integration Tests', () => {
  let app: FastifyInstance;
  let mockCreateWordModel1Execute: ReturnType<typeof vi.fn>;
  let mockUpdateWordModel1Execute: ReturnType<typeof vi.fn>;
  let mockDeleteWordDeleteModelo1: ReturnType<typeof vi.fn>;
  let mockManageCreateCampoSemantico: ReturnType<typeof vi.fn>;
  let mockManageUpdateCampoSemantico: ReturnType<typeof vi.fn>;
  let mockManageDeleteCampoSemantico: ReturnType<typeof vi.fn>;
  let mockManageCreateSubcampo: ReturnType<typeof vi.fn>;
  let mockManageUpdateSubcampo: ReturnType<typeof vi.fn>;
  let mockManageDeleteSubcampo: ReturnType<typeof vi.fn>;
  let mockManageCreateMicrocampo: ReturnType<typeof vi.fn>;
  let mockManageUpdateMicrocampo: ReturnType<typeof vi.fn>;
  let mockManageDeleteMicrocampo: ReturnType<typeof vi.fn>;

  // ========== MOCK DATA ==========

  const mockCreatedWord = {
    id: BigInt(1),
    namtrikTermino: 'misak',
    espanolTermino: 'gente',
    namtrikDescripcion: 'Pueblo originario',
    espanolDescripcion: 'Pueblo indígena del Cauca',
    namtrikAudio: null,
    espanolAudio: null,
    imagen: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    microcampos: [],
  };

  const mockUpdatedWord = {
    ...mockCreatedWord,
    espanolTermino: 'personas',
    updatedAt: new Date('2025-06-01'),
  };

  const mockCampoSemantico = {
    id: BigInt(1),
    namtrikTermino: 'naturaleza',
    espanolTermino: 'naturaleza',
    namtrikDescripcion: 'Mundo natural',
    espanolDescripcion: 'Elementos de la naturaleza',
    namtrikAudio: null,
    espanolAudio: null,
    imagen: null,
  };

  const mockSubcampo = {
    id: BigInt(10),
    campoSemanticoId: BigInt(1),
    namtrikTermino: 'animales',
    espanolTermino: 'animales',
    namtrikDescripcion: 'Seres vivos',
    espanolDescripcion: 'Animales del territorio',
  };

  const mockMicrocampo = {
    id: BigInt(100),
    subcampoSemanticoId: BigInt(10),
    namtrikTermino: 'aves',
    espanolTermino: 'aves',
    namtrikDescripcion: 'Pájaros del territorio',
    espanolDescripcion: 'Aves de la región',
  };

  const validCreateWordPayload = {
    namtrikTermino: 'misak',
    espanolTermino: 'gente',
    namtrikDescripcion: 'Pueblo originario',
    espanolDescripcion: 'Pueblo indígena del Cauca',
  };

  const validUpdateWordPayload = {
    espanolTermino: 'personas',
  };

  const validCampoSemanticoPayload = {
    namtrikTermino: 'naturaleza',
    espanolTermino: 'naturaleza',
    namtrikDescripcion: 'Mundo natural',
    espanolDescripcion: 'Elementos de la naturaleza',
  };

  const validSubcampoPayload = {
    campoSemanticoId: '1',
    namtrikTermino: 'animales',
    espanolTermino: 'animales',
    namtrikDescripcion: 'Seres vivos',
    espanolDescripcion: 'Animales del territorio',
  };

  const validMicrocampoPayload = {
    subcampoSemanticoId: '10',
    namtrikTermino: 'aves',
    espanolTermino: 'aves',
    namtrikDescripcion: 'Pájaros del territorio',
    espanolDescripcion: 'Aves de la región',
  };

  beforeEach(async () => {
    // 1. Crear funciones mock
    mockCreateWordModel1Execute = vi.fn();
    mockUpdateWordModel1Execute = vi.fn();
    mockDeleteWordDeleteModelo1 = vi.fn();
    mockManageCreateCampoSemantico = vi.fn();
    mockManageUpdateCampoSemantico = vi.fn();
    mockManageDeleteCampoSemantico = vi.fn();
    mockManageCreateSubcampo = vi.fn();
    mockManageUpdateSubcampo = vi.fn();
    mockManageDeleteSubcampo = vi.fn();
    mockManageCreateMicrocampo = vi.fn();
    mockManageUpdateMicrocampo = vi.fn();
    mockManageDeleteMicrocampo = vi.fn();

    // 2. Crear mock use cases
    const mockCreateWordModel1UseCase = {
      execute: mockCreateWordModel1Execute,
    } as unknown as CreateWordModel1UseCase;

    const mockUpdateWordModel1UseCase = {
      execute: mockUpdateWordModel1Execute,
    } as unknown as UpdateWordModel1UseCase;

    const mockDeleteWordUseCase = {
      deleteModelo1: mockDeleteWordDeleteModelo1,
      deleteModelo2: vi.fn(),
      restoreModelo1: vi.fn(),
      restoreModelo2: vi.fn(),
    } as unknown as DeleteWordUseCase;

    const mockManageSemanticFieldsUseCase = {
      createCampoSemantico: mockManageCreateCampoSemantico,
      updateCampoSemantico: mockManageUpdateCampoSemantico,
      deleteCampoSemantico: mockManageDeleteCampoSemantico,
      createSubcampoSemantico: mockManageCreateSubcampo,
      updateSubcampoSemantico: mockManageUpdateSubcampo,
      deleteSubcampoSemantico: mockManageDeleteSubcampo,
      createMicrocampo: mockManageCreateMicrocampo,
      updateMicrocampo: mockManageUpdateMicrocampo,
      deleteMicrocampo: mockManageDeleteMicrocampo,
    } as unknown as ManageSemanticFieldsUseCase;

    // 3. Crear controller con use cases mockeados
    const controller = new AdminDictionaryController(
      mockCreateWordModel1UseCase,
      mockUpdateWordModel1UseCase,
      mockDeleteWordUseCase,
      mockManageSemanticFieldsUseCase,
    );

    // 4. Crear instancia Fastify y registrar rutas manualmente
    app = Fastify({ logger: false });
    app.post('/words', controller.createWordModel1.bind(controller));
    app.put('/words/:id', controller.updateWordModel1.bind(controller));
    app.delete('/words/:id', controller.deleteWordModel1.bind(controller));
    app.post('/campos-semanticos', controller.createCampoSemantico.bind(controller));
    app.put('/campos-semanticos/:id', controller.updateCampoSemantico.bind(controller));
    app.delete('/campos-semanticos/:id', controller.deleteCampoSemantico.bind(controller));
    app.post('/subcampos', controller.createSubcampoSemantico.bind(controller));
    app.put('/subcampos/:id', controller.updateSubcampoSemantico.bind(controller));
    app.delete('/subcampos/:id', controller.deleteSubcampoSemantico.bind(controller));
    app.post('/microcampos', controller.createMicrocampo.bind(controller));
    app.put('/microcampos/:id', controller.updateMicrocampo.bind(controller));
    app.delete('/microcampos/:id', controller.deleteMicrocampo.bind(controller));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  // ========== PALABRAS MODELO 1 ==========

  describe('POST /words (createWordModel1)', () => {
    it('debería crear una palabra y retornar 201 con BigInt serializado', async () => {
      // Arrange
      mockCreateWordModel1Execute.mockResolvedValue(mockCreatedWord);

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/words',
        payload: validCreateWordPayload,
      });

      // Assert
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('1');
      expect(body.namtrikTermino).toBe('misak');
      expect(body.espanolTermino).toBe('gente');
    });

    it('debería retornar error 409 cuando la palabra ya existe (AppError)', async () => {
      // Arrange
      mockCreateWordModel1Execute.mockRejectedValue(
        new AppError('Ya existe una palabra con este término en Namtrik', 409),
      );

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/words',
        payload: validCreateWordPayload,
      });

      // Assert
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Ya existe una palabra con este término en Namtrik');
    });

    it('debería manejar error de validación Zod cuando faltan campos requeridos', async () => {
      // Arrange - payload vacío, Zod lanzará error antes de llegar al use case

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/words',
        payload: { namtrikTermino: 'misak' }, // faltan campos requeridos
      });

      // Assert - handleError captura ZodError como error genérico → 500
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Error interno del servidor');
      expect(mockCreateWordModel1Execute).not.toHaveBeenCalled();
    });
  });

  describe('PUT /words/:id (updateWordModel1)', () => {
    it('debería actualizar una palabra y retornar 200 con BigInt serializado', async () => {
      // Arrange
      mockUpdateWordModel1Execute.mockResolvedValue(mockUpdatedWord);

      // Act
      const response = await app.inject({
        method: 'PUT',
        url: '/words/1',
        payload: validUpdateWordPayload,
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('1');
      expect(body.espanolTermino).toBe('personas');
    });

    it('debería retornar error 404 cuando la palabra no existe (AppError)', async () => {
      // Arrange
      mockUpdateWordModel1Execute.mockRejectedValue(new AppError('Palabra no encontrada', 404));

      // Act
      const response = await app.inject({
        method: 'PUT',
        url: '/words/999',
        payload: validUpdateWordPayload,
      });

      // Assert
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Palabra no encontrada');
    });
  });

  describe('DELETE /words/:id (deleteWordModel1)', () => {
    it('debería eliminar una palabra y retornar 204', async () => {
      // Arrange
      mockDeleteWordDeleteModelo1.mockResolvedValue(undefined);

      // Act
      const response = await app.inject({
        method: 'DELETE',
        url: '/words/1',
      });

      // Assert
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockDeleteWordDeleteModelo1).toHaveBeenCalledWith(BigInt(1));
    });

    it('debería retornar error 404 cuando la palabra no existe (AppError)', async () => {
      // Arrange
      mockDeleteWordDeleteModelo1.mockRejectedValue(new AppError('Palabra no encontrada', 404));

      // Act
      const response = await app.inject({
        method: 'DELETE',
        url: '/words/999',
      });

      // Assert
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Palabra no encontrada');
    });
  });

  // ========== CAMPOS SEMÁNTICOS ==========

  describe('POST /campos-semanticos (createCampoSemantico)', () => {
    it('debería crear un campo semántico y retornar 201', async () => {
      // Arrange
      mockManageCreateCampoSemantico.mockResolvedValue(mockCampoSemantico);

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/campos-semanticos',
        payload: validCampoSemanticoPayload,
      });

      // Assert
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('1');
      expect(body.namtrikTermino).toBe('naturaleza');
    });
  });

  describe('PUT /campos-semanticos/:id (updateCampoSemantico)', () => {
    it('debería actualizar un campo semántico y retornar 200', async () => {
      // Arrange
      const updatedCampo = {
        ...mockCampoSemantico,
        espanolTermino: 'naturaleza actualizada',
      };
      mockManageUpdateCampoSemantico.mockResolvedValue(updatedCampo);

      // Act
      const response = await app.inject({
        method: 'PUT',
        url: '/campos-semanticos/1',
        payload: { espanolTermino: 'naturaleza actualizada' },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.espanolTermino).toBe('naturaleza actualizada');
    });
  });

  describe('DELETE /campos-semanticos/:id (deleteCampoSemantico)', () => {
    it('debería eliminar un campo semántico y retornar 204', async () => {
      // Arrange
      mockManageDeleteCampoSemantico.mockResolvedValue(undefined);

      // Act
      const response = await app.inject({
        method: 'DELETE',
        url: '/campos-semanticos/1',
      });

      // Assert
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockManageDeleteCampoSemantico).toHaveBeenCalledWith(BigInt(1));
    });
  });

  // ========== SUBCAMPOS SEMÁNTICOS ==========

  describe('POST /subcampos (createSubcampoSemantico)', () => {
    it('debería crear un subcampo semántico y retornar 201', async () => {
      // Arrange
      mockManageCreateSubcampo.mockResolvedValue(mockSubcampo);

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/subcampos',
        payload: validSubcampoPayload,
      });

      // Assert
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('10');
      expect(body.campoSemanticoId).toBe('1');
      expect(body.namtrikTermino).toBe('animales');
    });
  });

  describe('DELETE /subcampos/:id (deleteSubcampoSemantico)', () => {
    it('debería eliminar un subcampo semántico y retornar 204', async () => {
      // Arrange
      mockManageDeleteSubcampo.mockResolvedValue(undefined);

      // Act
      const response = await app.inject({
        method: 'DELETE',
        url: '/subcampos/10',
      });

      // Assert
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockManageDeleteSubcampo).toHaveBeenCalledWith(BigInt(10));
    });
  });

  // ========== MICROCAMPOS ==========

  describe('POST /microcampos (createMicrocampo)', () => {
    it('debería crear un microcampo y retornar 201', async () => {
      // Arrange
      mockManageCreateMicrocampo.mockResolvedValue(mockMicrocampo);

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/microcampos',
        payload: validMicrocampoPayload,
      });

      // Assert
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('100');
      expect(body.subcampoSemanticoId).toBe('10');
      expect(body.namtrikTermino).toBe('aves');
    });
  });

  describe('DELETE /microcampos/:id (deleteMicrocampo)', () => {
    it('debería eliminar un microcampo y retornar 204', async () => {
      // Arrange
      mockManageDeleteMicrocampo.mockResolvedValue(undefined);

      // Act
      const response = await app.inject({
        method: 'DELETE',
        url: '/microcampos/100',
      });

      // Assert
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockManageDeleteMicrocampo).toHaveBeenCalledWith(BigInt(100));
    });
  });

  // ========== handleError ==========

  describe('handleError (error inesperado)', () => {
    it('debería retornar 500 ante error inesperado en cualquier operación', async () => {
      // Arrange
      mockCreateWordModel1Execute.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/words',
        payload: validCreateWordPayload,
      });

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Error interno del servidor');
    });
  });
});
