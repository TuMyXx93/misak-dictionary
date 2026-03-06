/**
 * AppError Tests
 * Verifica la clase de error personalizada para errores de aplicación
 */

import { describe, expect, it } from 'vitest';
import { AppError } from './AppError.js';

describe('AppError', () => {
  describe('constructor', () => {
    it('debería crear un error con mensaje y statusCode por defecto (500)', () => {
      // Arrange & Act
      const error = new AppError('Algo salió mal');

      // Assert
      expect(error.message).toBe('Algo salió mal');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('debería crear un error con statusCode personalizado', () => {
      // Arrange & Act
      const error = new AppError('No encontrado', 404);

      // Assert
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('No encontrado');
      expect(error.isOperational).toBe(true);
    });

    it('debería crear un error con isOperational = false', () => {
      // Arrange & Act
      const error = new AppError('Error de programación', 500, false);

      // Assert
      expect(error.isOperational).toBe(false);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('herencia', () => {
    it('debería ser una instancia de Error', () => {
      // Arrange & Act
      const error = new AppError('Test error');

      // Assert
      expect(error).toBeInstanceOf(Error);
    });

    it('debería ser una instancia de AppError', () => {
      // Arrange & Act
      const error = new AppError('Test error');

      // Assert
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('propiedades', () => {
    it('debería tener el mensaje correcto accesible desde .message', () => {
      // Arrange
      const expectedMessage = 'Credenciales inválidas';

      // Act
      const error = new AppError(expectedMessage, 401);

      // Assert
      expect(error.message).toBe(expectedMessage);
    });

    it('debería tener stack trace definido', () => {
      // Arrange & Act
      const error = new AppError('Error con stack');

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });
});
