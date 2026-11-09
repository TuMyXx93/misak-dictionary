/**
 * Utilitario de serialización para objetos que contienen BigInt.
 * Convierte valores BigInt a string para evitar errores con JSON.stringify.
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString() as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj;
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = serializeBigInt((obj as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return obj;
}
