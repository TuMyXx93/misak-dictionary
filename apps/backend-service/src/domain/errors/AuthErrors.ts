/**
 * AuthErrors.ts
 * Spec 008 (R-003) — Jerarquía tipada de errores de autenticación y acceso.
 * Permite que controladores y middleware clasifiquen los incidentes de forma
 * inequívoca sin recurrir a comparación frágil de cadenas de texto.
 */

export abstract class DomainAuthError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidCredentialsError extends DomainAuthError {
  readonly code = 'AUTH_INVALID_CREDENTIALS';
  readonly httpStatus = 401;

  constructor(message = 'Credenciales inválidas. Por favor verifique sus datos.') {
    super(message);
  }
}

export class AccountLockedError extends DomainAuthError {
  readonly code = 'AUTH_ACCOUNT_LOCKED';
  readonly httpStatus = 423; // 423 Locked

  constructor(
    public readonly lockedUntil: Date,
    public readonly retryAfterSeconds: number,
    message = 'Cuenta bloqueada temporalmente por intentos fallidos. Intente más tarde o contacte al administrador.',
  ) {
    super(message);
  }
}

export class AccountSuspendedError extends DomainAuthError {
  readonly code = 'AUTH_ACCOUNT_SUSPENDED';
  readonly httpStatus = 403; // 403 Forbidden

  constructor(
    message = 'Esta cuenta está suspendida. Comuníquese con un administrador del Equipo Namtrik.',
  ) {
    super(message);
  }
}
