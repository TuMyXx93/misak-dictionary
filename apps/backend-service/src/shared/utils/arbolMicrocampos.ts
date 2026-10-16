/**
 * Convierte la lista plana de microcampos de un subcampo (todas las profundidades)
 * en un árbol ordenado por posición. Función pura, sin acceso a base de datos.
 *
 * Los hijos de un nodo que no esté en la lista (p. ej., borrado lógicamente) se
 * omiten junto con él: forman parte de su subárbol.
 */

export interface MicrocampoPlano {
  id: bigint;
  padreId: bigint | null;
  posicion: number;
  codigo: string;
}

export type MicrocampoConSubniveles<T extends MicrocampoPlano> = T & {
  subniveles: MicrocampoConSubniveles<T>[];
};

export function arbolarMicrocampos<T extends MicrocampoPlano>(
  planos: readonly T[],
): MicrocampoConSubniveles<T>[] {
  const nodos = new Map<string, MicrocampoConSubniveles<T>>();
  for (const plano of planos) {
    nodos.set(plano.id.toString(), { ...plano, subniveles: [] });
  }

  const raices: MicrocampoConSubniveles<T>[] = [];
  for (const nodo of nodos.values()) {
    if (nodo.padreId === null) {
      raices.push(nodo);
      continue;
    }
    nodos.get(nodo.padreId.toString())?.subniveles.push(nodo);
  }

  const ordenar = (lista: MicrocampoConSubniveles<T>[]) => {
    lista.sort((a, b) => a.posicion - b.posicion || a.codigo.localeCompare(b.codigo));
    for (const nodo of lista) ordenar(nodo.subniveles);
  };
  ordenar(raices);
  return raices;
}
