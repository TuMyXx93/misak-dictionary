/**
 * AppError
 * Clase de error personalizada para errores de aplicación
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Mantener stack trace correctamente
    Error.captureStackTrace(this, this.constructor);
  }
}
