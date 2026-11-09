/**
 * @module taxonomyPlan.test
 * @description Plan de importación de taxonomía (funciones puras, sin base de datos).
 */

import { describe, expect, it } from 'vitest';
import { normalizarNamtrik } from '../../shared/utils/namtrik.js';
import { toSlug } from '../../shared/utils/slug.js';
import { compararPlan, construirPlan, type FilaExistente } from './taxonomyPlan.js';
import { MAX_PROFUNDIDAD_SUBNIVELES, taxonomiaSchema } from './taxonomySchema.js';

function archivoCon(micros: unknown[], subcampoCodigo = 'C1.S1') {
  return taxonomiaSchema.parse({
    version: 1,
    fuente: { documento: 'prueba.pdf', revisor: 'equipo' },
    campos: [
      {
        codigo: 'C1',
        namtrik: 'Ya',
        espanol: 'La casa',
        subcampos: [
          {
            codigo: subcampoCodigo,
            namtrik: 'Nakchak',
            espanol: 'Cocina',
            microcampos: micros,
          },
        ],
      },
    ],
  });
}

const micro19 = {
  codigo: 'C1.S1.M19',
  namtrik: 'Namui asru mɵrɵraik',
  espanol: 'Acciones y estados humanos',
  subniveles: [
    {
      codigo: 'C1.S1.M19.1',
      espanol: 'Funciones fisiológicas básicas',
      subniveles: [
        {
          codigo: 'C1.S1.M19.1.1',
          espanol: 'Excreción',
          subniveles: [{ codigo: 'C1.S1.M19.1.1.1', espanol: 'Flatulencia' }],
        },
      ],
    },
    { codigo: 'C1.S1.M19.2', espanol: 'Manifestaciones expresivas' },
  ],
};

const archivoMinimo = archivoCon([
  {
    codigo: 'C1.S1.M1',
    namtrik: 'Mɵ tsilɵmera',
    espanol: 'Plantas',
    subniveles: [{ codigo: 'C1.S1.M1.1', espanol: 'Sub uno' }],
  },
]);

describe('normalizarNamtrik', () => {
  it('convierte la o y las variantes ə/ɔ a ɵ', () => {
    expect(normalizarNamtrik('Mo tsilomera').valor).toBe('Mɵ tsilɵmera');
    expect(normalizarNamtrik('Mə').valor).toBe('Mɵ');
  });

  it('cuenta los cambios realizados', () => {
    expect(normalizarNamtrik('Ya').cambios).toBe(0);
    expect(normalizarNamtrik('Mo').cambios).toBe(1);
  });
});

describe('toSlug', () => {
  it('genera slugs ASCII estables a partir de Namtrik', () => {
    expect(toSlug('Namui Nu Pirɵ')).toBe('namui-nu-piro');
    expect(toSlug('Ya tul')).toBe('ya-tul');
  });
});

describe('construirPlan', () => {
  it('aplana campo, subcampo, microcampo y subnivel en orden padre→hijo', () => {
    const plan = construirPlan(archivoMinimo);

    expect(plan.errores).toEqual([]);
    expect(plan.nodos.map((n) => [n.nivel, n.codigo, n.profundidad])).toEqual([
      ['campo', 'C1', 0],
      ['subcampo', 'C1.S1', 0],
      ['microcampo', 'C1.S1.M1', 0],
      ['microcampo', 'C1.S1.M1.1', 1],
    ]);
  });

  it('soporta subniveles de profundidad arbitraria y los hijos comparten subcampo', () => {
    const plan = construirPlan(archivoCon([micro19]));

    expect(plan.errores).toEqual([]);
    const flatulencia = plan.nodos.find((n) => n.codigo === 'C1.S1.M19.1.1.1');
    expect(flatulencia).toMatchObject({
      nivel: 'microcampo',
      profundidad: 3,
      padreCodigo: 'C1.S1.M19.1.1',
      subcampoCodigo: 'C1.S1',
    });
    const orden = plan.nodos.map((n) => n.codigo);
    expect(orden.indexOf('C1.S1.M19')).toBeLessThan(orden.indexOf('C1.S1.M19.1.1.1'));
  });

  it('normaliza el Namtrik del microcampo y registra el cambio', () => {
    const plan = construirPlan(
      archivoCon([{ codigo: 'C1.S1.M1', namtrik: 'Mo tsilomera', espanol: 'Plantas' }]),
    );

    expect(plan.nodos.find((n) => n.codigo === 'C1.S1.M1')?.namtrik).toBe('Mɵ tsilɵmera');
    expect(plan.cambiosOrtograficos).toEqual([
      { codigo: 'C1.S1.M1', antes: 'Mo tsilomera', despues: 'Mɵ tsilɵmera' },
    ]);
  });

  it('rechaza un subnivel que supera la profundidad máxima', () => {
    let anidado: Record<string, unknown> = {
      codigo: 'C1.S1.M1',
      espanol: 'Hoja',
    };
    for (let nivel = 1; nivel <= MAX_PROFUNDIDAD_SUBNIVELES + 1; nivel++) {
      anidado = {
        codigo: `${anidado.codigo}.1`,
        espanol: `Nivel ${nivel}`,
        subniveles: [anidado],
      };
    }
    const archivo = archivoCon([anidado]);

    const plan = construirPlan(archivo);

    expect(plan.errores.some((e) => e.includes('profundidad máxima'))).toBe(true);
  });

  it('detecta códigos de hijo que no pertenecen a su padre', () => {
    const plan = construirPlan(
      archivoCon([
        {
          codigo: 'C1.S1.M1',
          espanol: 'Plantas',
          subniveles: [{ codigo: 'C9.S1.M1.1', espanol: 'X' }],
        },
      ]),
    );

    expect(plan.errores.some((e) => e.includes('C9.S1.M1.1 no pertenece a C1.S1.M1'))).toBe(true);
  });

  it('detecta nombres repetidos entre hermanos', () => {
    const plan = construirPlan(
      archivoCon([
        {
          codigo: 'C1.S1.M1',
          espanol: 'Plantas',
          subniveles: [
            { codigo: 'C1.S1.M1.1', espanol: 'Hoja' },
            { codigo: 'C1.S1.M1.2', espanol: 'Hoja' },
          ],
        },
      ]),
    );

    expect(plan.errores.some((e) => e.includes('nombre repetido "espanol:Hoja"'))).toBe(true);
  });

  it('no reporta nombres repetidos entre padres distintos; el slug sí, por ser único en el subcampo', () => {
    const plan = construirPlan(
      archivoCon([
        {
          codigo: 'C1.S1.M1',
          espanol: 'Plantas',
          subniveles: [{ codigo: 'C1.S1.M1.1', espanol: 'Hoja' }],
        },
        {
          codigo: 'C1.S1.M2',
          espanol: 'Flores',
          subniveles: [{ codigo: 'C1.S1.M2.1', espanol: 'Hoja' }],
        },
      ]),
    );

    expect(plan.errores.some((e) => e.includes('nombre repetido'))).toBe(false);
    expect(plan.errores.some((e) => e.includes('slug repetido "hoja"'))).toBe(true);
  });

  it('detecta slugs repetidos dentro del subcampo aunque sean de padres distintos', () => {
    const plan = construirPlan(
      archivoCon([
        {
          codigo: 'C1.S1.M1',
          espanol: 'Plantas',
          subniveles: [{ codigo: 'C1.S1.M1.1', espanol: 'Hoja verde' }],
        },
        {
          codigo: 'C1.S1.M2',
          espanol: 'Flores',
          subniveles: [{ codigo: 'C1.S1.M2.1', espanol: 'Hoja-verde' }],
        },
      ]),
    );

    expect(plan.errores.some((e) => e.includes('slug repetido "hoja-verde"'))).toBe(true);
  });
});

describe('compararPlan', () => {
  const plan = construirPlan(archivoMinimo);

  function filasDesdePlan(): FilaExistente[] {
    return plan.nodos.map((n, i) => ({
      id: BigInt(i + 1),
      codigo: n.codigo,
      nivel: n.nivel,
      padreCodigo: n.padreCodigo,
      subcampoCodigo: n.subcampoCodigo,
      profundidad: n.profundidad,
      namtrik: n.namtrik,
      espanol: n.espanol,
      descripcion: n.descripcion,
      slug: n.slug,
      posicion: n.posicion,
    }));
  }

  it('crea los nodos que no existen', () => {
    const acciones = compararPlan(plan.nodos, []);

    expect(acciones.every((a) => a.tipo === 'crear')).toBe(true);
  });

  it('marca sin cambios cuando la fila coincide', () => {
    const acciones = compararPlan(plan.nodos, filasDesdePlan());

    expect(acciones.every((a) => a.tipo === 'sin_cambios')).toBe(true);
  });

  it('marca conflicto cuando otro código ya usa el mismo nombre entre hermanos', () => {
    const existentes: FilaExistente[] = [
      {
        id: 99n,
        codigo: 'C1.S1.M50',
        nivel: 'microcampo',
        padreCodigo: 'C1.S1',
        subcampoCodigo: 'C1.S1',
        profundidad: 0,
        namtrik: 'Mɵ tsilɵmera',
        espanol: 'Otro',
        descripcion: null,
        slug: 'mo-tsilomera',
        posicion: 50,
      },
    ];

    const acciones = compararPlan(plan.nodos, existentes);
    const conflictoM1 = acciones.find((a) => a.nodo.codigo === 'C1.S1.M1');

    expect(conflictoM1?.tipo).toBe('conflicto');
    expect(conflictoM1?.motivo).toContain('C1.S1.M50');
  });

  it('marca conflicto si un nodo existente cambia de profundidad', () => {
    const filas = filasDesdePlan().map((f) =>
      f.codigo === 'C1.S1.M1.1' ? { ...f, profundidad: 0 } : f,
    );

    const acciones = compararPlan(plan.nodos, filas);

    expect(acciones.find((a) => a.nodo.codigo === 'C1.S1.M1.1')?.tipo).toBe('conflicto');
  });
});
