/**
 * Domain Port: ISemanticEmbeddingProvider
 * Spec 012 / ADR-0008: Búsqueda Semántica Vectorial en PostgreSQL con pgvector
 *
 * Principio CARE / Soberanía de Datos Indígenas:
 * Cero exfiltración de datos a LLMs o APIs externas de terceros.
 * Por defecto se provee NullEmbeddingProvider (deshabilitado en caliente),
 * permitiendo ejecutar búsqueda híbrida sin dependencias externas ni llamadas de red.
 */

export interface ISemanticEmbeddingProvider {
  /**
   * Dimensión del vector de embedding (384 para modelos ligeros tipo all-MiniLM-L6-v2 o bilingüe local).
   */
  readonly dimensions: number;

  /**
   * Indica si el proveedor está habilitado y listo para generar embeddings.
   */
  isEnabled(): boolean;

  /**
   * Genera el vector de embedding para una consulta dada.
   * Retorna null si el proveedor está inactivo o si la consulta está vacía.
   */
  embedQuery(query: string): Promise<number[] | null>;
}

/**
 * Proveedor nulo por defecto (Null Object Pattern).
 * Garantiza inmunidad total contra llamadas de red y exfiltración de datos.
 */
export class NullEmbeddingProvider implements ISemanticEmbeddingProvider {
  readonly dimensions = 384;

  isEnabled(): boolean {
    return false;
  }

  async embedQuery(_query: string): Promise<number[] | null> {
    return null;
  }
}
