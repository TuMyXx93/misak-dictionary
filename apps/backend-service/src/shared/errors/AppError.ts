/**
 * AppError
 * Clase de error personalizada para errores de aplicación
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string | undefined;

  constructor(message: string, statusCode = 500, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    // Mantener stack trace correctamente
    Error.captureStackTrace(this, this.constructor);
  }
}
