/**
 * Plan de importación de taxonomía (funciones puras, sin base de datos).
 * 1) construirPlan: normaliza ortografía namtrik, deriva slugs, aplana el árbol de
 *    microcampos (cualquier profundidad) en orden padre→hijo y valida el archivo.
 * 2) compararPlan: decide crear / actualizar / sin cambios / conflicto frente a la BD.
 *
 * Reglas de unicidad (espejo de la migración 0007):
 *  · slug único por ámbito: campos (global), subcampos (dentro del campo),
 *    microcampos (dentro del subcampo, cualquier profundidad).
 *  · nombre (namtrik o español) único entre hermanos (mismo padre).
 */

import { normalizarNamtrik } from '../../shared/utils/namtrik.js';
import { toSlug } from '../../shared/utils/slug.js';
import {
  type BotonesHomeArchivo,
  MAX_PROFUNDIDAD_SUBNIVELES,
  type MicrocampoArchivo,
  type TaxonomiaArchivo,
} from './taxonomySchema.js';

export type Nivel = 'campo' | 'subcampo' | 'microcampo';

export interface NodoPlan {
  nivel: Nivel;
  codigo: string;
  /** campo: null · subcampo: código del campo · microcampo: subcampo (profundidad 0) o microcampo padre */
  padreCodigo: string | null;
  /** Solo microcampos: código del subcampo al que pertenece el árbol */
  subcampoCodigo: string | null;
  /** Solo microcampos: 0 = hijo directo del subcampo; n = subnivel a n niveles */
  profundidad: number;
  namtrik: string | null;
  espanol: string;
  descripcion: string | null;
  slug: string;
  posicion: number;
}

export interface CambioOrtografico {
  codigo: string;
  antes: string;
  despues: string;
}

export interface PlanNormalizado {
  nodos: NodoPlan[];
  cambiosOrtograficos: CambioOrtografico[];
  errores: string[];
}

export function construirPlan(archivo: TaxonomiaArchivo): PlanNormalizado {
  const nodos: NodoPlan[] = [];
  const cambiosOrtograficos: CambioOrtografico[] = [];
  const errores: string[] = [];
  const codigosVistos = new Set<string>();

  const registrar = (nodo: NodoPlan, original: string | null) => {
    if (codigosVistos.has(nodo.codigo)) {
      errores.push(`código duplicado: ${nodo.codigo}`);
    }
    codigosVistos.add(nodo.codigo);
    if (nodo.slug.length === 0) {
      errores.push(`slug vacío para ${nodo.codigo}`);
    }
    if (original !== null && original !== nodo.namtrik) {
      cambiosOrtograficos.push({
        codigo: nodo.codigo,
        antes: original,
        despues: nodo.namtrik ?? '',
      });
    }
    nodos.push(nodo);
  };

  const visitarMicrocampo = (
    micro: MicrocampoArchivo,
    padreCodigo: string,
    subcampoCodigo: string,
    profundidad: number,
    posicion: number,
  ) => {
    if (!micro.codigo.startsWith(`${padreCodigo}.`)) {
      errores.push(`${micro.codigo} no pertenece a ${padreCodigo}`);
    }
    if (profundidad > MAX_PROFUNDIDAD_SUBNIVELES) {
      errores.push(
        `${micro.codigo} supera la profundidad máxima de subniveles (${MAX_PROFUNDIDAD_SUBNIVELES})`,
      );
      return;
    }
    const namtrik = micro.namtrik === undefined ? null : normalizarNamtrik(micro.namtrik).valor;
    registrar(
      {
        nivel: 'microcampo',
        codigo: micro.codigo,
        padreCodigo,
        subcampoCodigo,
        profundidad,
        namtrik,
        espanol: micro.espanol,
        descripcion: micro.glosa ?? null,
        slug: toSlug(namtrik ?? micro.espanol),
        posicion,
      },
      micro.namtrik ?? null,
    );
    micro.subniveles.forEach((hijo, indice) => {
      visitarMicrocampo(hijo, micro.codigo, subcampoCodigo, profundidad + 1, indice + 1);
    });
  };

  archivo.campos.forEach((campo, indiceCampo) => {
    const namtrik = normalizarNamtrik(campo.namtrik).valor;
    registrar(
      {
        nivel: 'campo',
        codigo: campo.codigo,
        padreCodigo: null,
        subcampoCodigo: null,
        profundidad: 0,
        namtrik,
        espanol: campo.espanol,
        descripcion: campo.glosa ?? null,
        slug: toSlug(namtrik),
        posicion: indiceCampo + 1,
      },
      campo.namtrik,
    );

    campo.subcampos.forEach((sub, indiceSub) => {
      if (!sub.codigo.startsWith(`${campo.codigo}.`)) {
        errores.push(`${sub.codigo} no pertenece al campo ${campo.codigo}`);
      }
      const subNamtrik = normalizarNamtrik(sub.namtrik).valor;
      registrar(
        {
          nivel: 'subcampo',
          codigo: sub.codigo,
          padreCodigo: campo.codigo,
          subcampoCodigo: null,
          profundidad: 0,
          namtrik: subNamtrik,
          espanol: sub.espanol,
          descripcion: sub.glosa ?? null,
          slug: toSlug(subNamtrik),
          posicion: indiceSub + 1,
        },
        sub.namtrik,
      );

      sub.microcampos.forEach((micro, indiceMicro) => {
        visitarMicrocampo(micro, sub.codigo, sub.codigo, 0, indiceMicro + 1);
      });
    });
  });

  errores.push(...erroresDeUnicidad(nodos));
  return { nodos, cambiosOrtograficos, errores };
}

/** Ámbito donde el slug debe ser único (espejo de los índices de la migración). */
function ambitoSlug(nodo: {
  nivel: Nivel;
  padreCodigo: string | null;
  subcampoCodigo: string | null;
}) {
  if (nodo.nivel === 'campo') return 'campo';
  if (nodo.nivel === 'subcampo') return `subcampo:${nodo.padreCodigo}`;
  return `microcampo:${nodo.subcampoCodigo}`;
}

/** Filas que compiten por nombre: mismo nivel y mismo padre (hermanos). */
function grupoHermanos(nodo: { nivel: Nivel; padreCodigo: string | null }) {
  return `${nodo.nivel}|${nodo.padreCodigo ?? ''}`;
}

function erroresDeUnicidad(nodos: NodoPlan[]): string[] {
  const errores: string[] = [];
  const slugs = new Map<string, string>();
  const nombres = new Map<string, string>();

  for (const nodo of nodos) {
    const claveSlug = `${ambitoSlug(nodo)}|${nodo.slug}`;
    const previoSlug = slugs.get(claveSlug);
    if (previoSlug !== undefined) {
      errores.push(`slug repetido "${nodo.slug}" entre ${previoSlug} y ${nodo.codigo}`);
    } else {
      slugs.set(claveSlug, nodo.codigo);
    }

    const grupo = grupoHermanos(nodo);
    const nombresNodo = [`espanol:${nodo.espanol}`];
    if (nodo.namtrik !== null) nombresNodo.push(`namtrik:${nodo.namtrik}`);
    for (const nombre of nombresNodo) {
      const clave = `${grupo}|${nombre}`;
      const previo = nombres.get(clave);
      if (previo !== undefined) {
        errores.push(`nombre repetido "${nombre}" entre hermanos ${previo} y ${nodo.codigo}`);
      } else {
        nombres.set(clave, nodo.codigo);
      }
    }
  }
  return errores;
}

/** Fila de la base de datos en la forma que usa el plan */
export interface FilaExistente {
  id: bigint;
  codigo: string;
  nivel: Nivel;
  padreCodigo: string | null;
  subcampoCodigo: string | null;
  profundidad: number;
  namtrik: string | null;
  espanol: string;
  descripcion: string | null;
  slug: string;
  posicion: number;
}

export type TipoAccion = 'crear' | 'actualizar' | 'sin_cambios' | 'conflicto';

export interface AccionNodo {
  tipo: TipoAccion;
  nodo: NodoPlan;
  motivo: string | null;
}

export function compararPlan(nodos: NodoPlan[], existentes: FilaExistente[]): AccionNodo[] {
  const porCodigo = new Map(existentes.map((fila) => [fila.codigo, fila]));

  return nodos.map((nodo): AccionNodo => {
    const actual = porCodigo.get(nodo.codigo);

    if (actual) {
      if (
        actual.nivel !== nodo.nivel ||
        actual.padreCodigo !== nodo.padreCodigo ||
        actual.profundidad !== nodo.profundidad
      ) {
        return conflicto(
          nodo,
          'cambia de nivel, de padre o de profundidad; usar el panel administrativo',
        );
      }
      const cambia =
        actual.namtrik !== nodo.namtrik ||
        actual.espanol !== nodo.espanol ||
        actual.descripcion !== nodo.descripcion ||
        actual.slug !== nodo.slug ||
        actual.posicion !== nodo.posicion;
      return {
        tipo: cambia ? 'actualizar' : 'sin_cambios',
        nodo,
        motivo: null,
      };
    }

    const ocupante = existentes.find((fila) => {
      if (fila.codigo === nodo.codigo) return false;
      const mismoSlug =
        fila.nivel === nodo.nivel &&
        ambitoSlug(fila) === ambitoSlug(nodo) &&
        fila.slug === nodo.slug;
      const mismoHermano =
        grupoHermanos(fila) === grupoHermanos(nodo) &&
        (fila.espanol === nodo.espanol || (nodo.namtrik !== null && fila.namtrik === nodo.namtrik));
      return mismoSlug || mismoHermano;
    });
    if (ocupante) {
      return conflicto(nodo, `nombre o slug ya usado por ${ocupante.codigo}`);
    }

    return { tipo: 'crear', nodo, motivo: null };
  });
}

function conflicto(nodo: NodoPlan, motivo: string): AccionNodo {
  return { tipo: 'conflicto', nodo, motivo };
}

export interface FilaBoton {
  clave: string;
  etiqueta: string;
  campoCodigo: string | null;
  posicion: number;
}

export interface AccionBoton {
  clave: string;
  tipo: 'actualizar' | 'sin_cambios';
  etiqueta: string;
  campoCodigo: string | null;
}

export function compararBotones(archivo: BotonesHomeArchivo, actuales: FilaBoton[]): AccionBoton[] {
  const porClave = new Map(actuales.map((fila) => [fila.clave, fila]));
  return archivo.botones.map((boton, indice) => {
    const actual = porClave.get(boton.clave);
    const cambia =
      !actual ||
      actual.etiqueta !== boton.etiqueta ||
      actual.campoCodigo !== boton.campo ||
      actual.posicion !== indice + 1;
    return {
      clave: boton.clave,
      tipo: cambia ? 'actualizar' : 'sin_cambios',
      etiqueta: boton.etiqueta,
      campoCodigo: boton.campo,
    };
  });
}
