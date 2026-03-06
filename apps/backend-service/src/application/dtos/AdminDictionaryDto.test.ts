/**
 * AdminDictionaryDto Tests
 * Verifica la validación de Zod schemas para el CRUD del diccionario admin
 */

import { describe, expect, it } from 'vitest';
import {
  CreateCampoSemanticoDTO,
  CreateMicrocampoDTO,
  CreateSubcampoSemanticoDTO,
  CreateWordModel1DTOSchema,
  CreateWordModel2DTOSchema,
  UpdateCampoSemanticoDTO,
  UpdateWordModel1DTOSchema,
} from './AdminDictionaryDto.js';

// ========== CreateWordModel1DTOSchema ==========

describe('CreateWordModel1DTOSchema', () => {
  const validData = {
    namtrikTermino: 'misak',
    espanolTermino: 'guambiano',
    namtrikDescripcion: 'Pueblo indígena del Cauca',
    espanolDescripcion: 'Pueblo indígena del Cauca en Colombia',
  };

  it('debería parsear datos válidos correctamente', () => {
    // Act
    const result = CreateWordModel1DTOSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.namtrikTermino).toBe('misak');
      expect(result.data.espanolTermino).toBe('guambiano');
    }
  });

  it('debería fallar cuando namtrikTermino está vacío', () => {
    // Arrange
    const invalidData = { ...validData, namtrikTermino: '' };

    // Act
    const result = CreateWordModel1DTOSchema.safeParse(invalidData);

    // Assert
    expect(result.success).toBe(false);
  });

  it('debería fallar cuando namtrikTermino excede 255 caracteres', () => {
    // Arrange
    const invalidData = { ...validData, namtrikTermino: 'a'.repeat(256) };

    // Act
    const result = CreateWordModel1DTOSchema.safeParse(invalidData);

    // Assert
    expect(result.success).toBe(false);
  });

  it('debería aceptar campos opcionales (audio, imagen)', () => {
    // Arrange
    const dataWithOptionals = {
      ...validData,
      namtrikAudio: 'https://cdn.example.com/audio.mp3',
      espanolAudio: 'https://cdn.example.com/audio-es.mp3',
      imagen: 'https://cdn.example.com/img.jpg',
    };

    // Act
    const result = CreateWordModel1DTOSchema.safeParse(dataWithOptionals);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.namtrikAudio).toBe('https://cdn.example.com/audio.mp3');
      expect(result.data.imagen).toBe('https://cdn.example.com/img.jpg');
    }
  });

  it('debería transformar microcamposIds de string a BigInt', () => {
    // Arrange
    const dataWithIds = {
      ...validData,
      microcamposIds: ['1', '2', '3'],
    };

    // Act
    const result = CreateWordModel1DTOSchema.safeParse(dataWithIds);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.microcamposIds).toEqual([BigInt(1), BigInt(2), BigInt(3)]);
    }
  });

  it('debería rechazar una URL inválida para audio', () => {
    // Arrange
    const invalidData = { ...validData, namtrikAudio: 'no-es-una-url' };

    // Act
    const result = CreateWordModel1DTOSchema.safeParse(invalidData);

    // Assert
    expect(result.success).toBe(false);
  });
});

// ========== UpdateWordModel1DTOSchema ==========

describe('UpdateWordModel1DTOSchema', () => {
  it('debería permitir datos parciales (todos los campos son opcionales)', () => {
    // Arrange
    const partialData = { espanolTermino: 'nuevo término' };

    // Act
    const result = UpdateWordModel1DTOSchema.safeParse(partialData);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.espanolTermino).toBe('nuevo término');
      expect(result.data.namtrikTermino).toBeUndefined();
    }
  });
});

// ========== CreateWordModel2DTOSchema ==========

describe('CreateWordModel2DTOSchema', () => {
  it('debería parsear datos válidos del modelo 2', () => {
    // Arrange
    const validData = {
      namtrikTerminoPregunta: '¿Naka?',
      espanolTraduccionPregunta: '¿Cómo estás?',
      namtrikTerminoRespuesta: 'Ñi tɵ',
      espanolTraduccionRespuesta: 'Estoy bien',
    };

    // Act
    const result = CreateWordModel2DTOSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.namtrikTerminoPregunta).toBe('¿Naka?');
      expect(result.data.namtrikTerminoRespuesta).toBe('Ñi tɵ');
    }
  });
});

// ========== CreateCampoSemanticoDTO ==========

describe('CreateCampoSemanticoDTO', () => {
  it('debería parsear datos válidos para campo semántico', () => {
    // Arrange
    const validData = {
      namtrikTermino: 'Isup',
      espanolTermino: 'Naturaleza',
      namtrikDescripcion: 'Descripción en Namtrik',
      espanolDescripcion: 'Descripción en español',
    };

    // Act
    const result = CreateCampoSemanticoDTO.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.namtrikTermino).toBe('Isup');
    }
  });
});

// ========== CreateSubcampoSemanticoDTO ==========

describe('CreateSubcampoSemanticoDTO', () => {
  it('debería transformar campoSemanticoId de string a BigInt', () => {
    // Arrange
    const validData = {
      campoSemanticoId: '42',
      namtrikTermino: 'Pishimisak',
      espanolTermino: 'Espíritu guardián',
      namtrikDescripcion: 'Descripción en Namtrik',
      espanolDescripcion: 'Descripción en español',
    };

    // Act
    const result = CreateSubcampoSemanticoDTO.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.campoSemanticoId).toBe(BigInt(42));
    }
  });
});

// ========== CreateMicrocampoDTO ==========

describe('CreateMicrocampoDTO', () => {
  it('debería transformar subcampoSemanticoId de string a BigInt', () => {
    // Arrange
    const validData = {
      subcampoSemanticoId: '99',
      namtrikTermino: 'Yau',
      espanolTermino: 'Casa',
      namtrikDescripcion: 'Descripción en Namtrik',
      espanolDescripcion: 'Descripción en español',
    };

    // Act
    const result = CreateMicrocampoDTO.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subcampoSemanticoId).toBe(BigInt(99));
    }
  });
});

// ========== UpdateCampoSemanticoDTO ==========

describe('UpdateCampoSemanticoDTO', () => {
  it('debería permitir un objeto vacío (todos los campos son opcionales)', () => {
    // Arrange
    const emptyData = {};

    // Act
    const result = UpdateCampoSemanticoDTO.safeParse(emptyData);

    // Assert
    expect(result.success).toBe(true);
  });
});
