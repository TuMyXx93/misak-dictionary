/**
 * Extrae el código HTTP de errores provenientes de `adminHttp`, `dictionaryApi` u otros clientes.
 */
export function extractHttpStatusCode(error: unknown): number | null {
  if (error && typeof error === 'object') {
    const record = error as { status?: unknown; statusCode?: unknown };
    if (typeof record.status === 'number' && Number.isFinite(record.status)) {
      return record.status;
    }
    if (typeof record.statusCode === 'number' && Number.isFinite(record.statusCode)) {
      return record.statusCode;
    }
  }

  if (error instanceof Error) {
    const match = /\bAPI\s+(\d{3}):/i.exec(error.message);
    if (match?.[1]) {
      return Number.parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Política global de reintentos de TanStack Query:
 * - Jamás reintenta errores 4xx del cliente (400, 401, 403, 404, 409, 422, 423, 429)
 *   para evitar cascadas contra túneles/NAT cuando existe un bloqueo RBAC o cuota 429.
 * - Permite máximo 1 reintento en errores transitorios de red, 408 o 5xx.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) {
    return false;
  }

  const status = extractHttpStatusCode(error);
  if (status !== null && status >= 400 && status < 500 && status !== 408) {
    return false;
  }

  return true;
}
