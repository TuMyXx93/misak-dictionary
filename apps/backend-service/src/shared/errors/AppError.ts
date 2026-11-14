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

/**
 * Error HTTP 416 Range Not Satisfiable con tamaño total del recurso (RFC 9110 §14.1.2)
 */
export class RangeNotSatisfiableError extends AppError {
  public readonly totalSize: number;

  constructor(totalSize: number, message = 'Rango de bytes solicitado no satisfacible') {
    super(message, 416, true, 'RANGE_NOT_SATISFIABLE');
    this.name = 'RangeNotSatisfiableError';
    this.totalSize = totalSize;
  }
}
