/**
 * @module arbolMicrocampos.test
 * @description Armado del árbol de microcampos a partir de la lista plana.
 */

import { describe, expect, it } from 'vitest';
import { arbolarMicrocampos, type MicrocampoPlano } from './arbolMicrocampos.js';

function micro(
  id: number,
  padre: number | null,
  posicion: number,
  codigo = `M${id}`,
): MicrocampoPlano {
  return {
    id: BigInt(id),
    padreId: padre === null ? null : BigInt(padre),
    posicion,
    codigo,
  };
}

describe('arbolarMicrocampos', () => {
  it('anida subniveles de cualquier profundidad bajo su padre', () => {
    const arbol = arbolarMicrocampos([
      micro(1, null, 1),
      micro(2, 1, 1),
      micro(3, 2, 1),
      micro(4, 3, 1),
    ]);

    expect(arbol).toHaveLength(1);
    expect(arbol[0]?.subniveles[0]?.subniveles[0]?.subniveles[0]?.id).toBe(4n);
  });

  it('ordena cada nivel por posición', () => {
    const arbol = arbolarMicrocampos([
      micro(1, null, 2),
      micro(2, null, 1),
      micro(3, 2, 2),
      micro(4, 2, 1),
    ]);

    expect(arbol.map((n) => n.id)).toEqual([2n, 1n]);
    expect(arbol[0]?.subniveles.map((n) => n.id)).toEqual([4n, 3n]);
  });

  it('oculta el subárbol de un padre que no está en la lista (borrado lógico)', () => {
    const arbol = arbolarMicrocampos([micro(1, null, 1), micro(3, 2, 1)]);

    expect(arbol.map((n) => n.id)).toEqual([1n]);
    expect(arbol[0]?.subniveles).toEqual([]);
  });

  it('devuelve lista vacía cuando no hay microcampos', () => {
    expect(arbolarMicrocampos([])).toEqual([]);
  });
});
