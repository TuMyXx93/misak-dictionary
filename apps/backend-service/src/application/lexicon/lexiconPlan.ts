/**
 * Planificación pura e idempotente para la importación léxica (Spec 005).
 * Compara el archivo `lexico.yaml` contra el estado actual de la base de datos
 * sin realizar escrituras.
 */

import type {
  DescripcionNodoArchivo,
  FormaNamtrikArchivo,
  LexicoArchivo,
  SentidoLexicoArchivo,
} from './lexiconSchema.js';

export type NivelTaxonomico = 'campo' | 'subcampo' | 'microcampo';

export interface NodoTaxonomicoRef {
  id: bigint;
  nivel: NivelTaxonomico;
  codigo: string;
  namtrikDescripcion: string | null;
  espanolDescripcion: string | null;
}

export interface SentidoExistenteSnapshot {
  id: bigint;
  codigo: string;
  nodoCodigo: string;
  posicion: number;
  tipo: string;
  namtrikContexto: string | null;
  espanolGlosa: string;
  espanolExplicacion: string | null;
  nombreCientifico: string | null;
  respuestaNamtrik: string | null;
  respuestaNamtrikContexto: string | null;
  respuestaEspanolGlosa: string | null;
  respuestaEspanolExplicacion: string | null;
  observacionEditorial: string | null;
  formas: FormaNamtrikArchivo[];
}

export interface AccionDescripcionNodo {
  tipo: 'actualizar' | 'sin_cambios';
  nodoId: bigint;
  nivel: NivelTaxonomico;
  descripcion: DescripcionNodoArchivo;
}

export interface AccionSentido {
  tipo: 'crear' | 'actualizar' | 'sin_cambios';
  sentidoExistenteId?: bigint | undefined;
  nodoId: bigint;
  nivelNodo: NivelTaxonomico;
  sentido: SentidoLexicoArchivo;
}

export interface PlanLexicoResultado {
  errores: string[];
  accionesDescripciones: AccionDescripcionNodo[];
  accionesSentidos: AccionSentido[];
  resumenSentidos: {
    crear: number;
    actualizar: number;
    sinCambios: number;
  };
  resumenDescripciones: {
    actualizar: number;
    sinCambios: number;
  };
}

function serializarFormas(formas: FormaNamtrikArchivo[]): string {
  return JSON.stringify(
    [...formas]
      .sort((a, b) => a.orden - b.orden)
      .map((f) => ({
        orden: f.orden,
        lema: f.lema,
        acepcionHomonima: f.acepcionHomonima ?? null,
        categoriaGramatical: f.categoriaGramatical ?? null,
        variante: f.variante ?? null,
        esNeologismo: f.esNeologismo,
        rasgosGramaticales: f.rasgosGramaticales,
        etiquetaOriginal: f.etiquetaOriginal ?? null,
      })),
  );
}

function sentidoCambio(nuevo: SentidoLexicoArchivo, actual: SentidoExistenteSnapshot): boolean {
  if (
    nuevo.tipo !== actual.tipo ||
    nuevo.nodoCodigo !== actual.nodoCodigo ||
    nuevo.posicion !== actual.posicion ||
    (nuevo.namtrikContexto ?? null) !== actual.namtrikContexto ||
    nuevo.espanolGlosa !== actual.espanolGlosa ||
    (nuevo.espanolExplicacion ?? null) !== actual.espanolExplicacion ||
    (nuevo.nombreCientifico ?? null) !== actual.nombreCientifico ||
    (nuevo.observacionEditorial ?? null) !== actual.observacionEditorial ||
    (nuevo.dialogo?.respuestaNamtrik ?? null) !== actual.respuestaNamtrik ||
    (nuevo.dialogo?.respuestaNamtrikContexto ?? null) !== actual.respuestaNamtrikContexto ||
    (nuevo.dialogo?.respuestaEspanolGlosa ?? null) !== actual.respuestaEspanolGlosa ||
    (nuevo.dialogo?.respuestaEspanolExplicacion ?? null) !== actual.respuestaEspanolExplicacion
  ) {
    return true;
  }

  return serializarFormas(nuevo.formas) !== serializarFormas(actual.formas);
}

export function construirPlanLexico(
  archivo: LexicoArchivo,
  nodosActivos: ReadonlyMap<string, NodoTaxonomicoRef>,
  sentidosExistentes: ReadonlyMap<string, SentidoExistenteSnapshot>,
): PlanLexicoResultado {
  const errores: string[] = [];
  const accionesDescripciones: AccionDescripcionNodo[] = [];
  const accionesSentidos: AccionSentido[] = [];
  const codigosSentidosVistos = new Set<string>();

  for (const desc of archivo.descripcionesNodos) {
    const nodo = nodosActivos.get(desc.nodoCodigo);
    if (!nodo) {
      errores.push(`nodo taxonómico inexistente para descripción: ${desc.nodoCodigo}`);
      continue;
    }

    const nuevoNamtrik = desc.namtrikDescripcion ?? nodo.namtrikDescripcion;
    const nuevoEspanol = desc.espanolDescripcion ?? nodo.espanolDescripcion;
    const cambio =
      nuevoNamtrik !== nodo.namtrikDescripcion || nuevoEspanol !== nodo.espanolDescripcion;

    accionesDescripciones.push({
      tipo: cambio ? 'actualizar' : 'sin_cambios',
      nodoId: nodo.id,
      nivel: nodo.nivel,
      descripcion: desc,
    });
  }

  for (const sentido of archivo.sentidos) {
    if (codigosSentidosVistos.has(sentido.codigo)) {
      errores.push(`código de sentido duplicado en archivo: ${sentido.codigo}`);
      continue;
    }
    codigosSentidosVistos.add(sentido.codigo);

    const nodo = nodosActivos.get(sentido.nodoCodigo);
    if (!nodo) {
      errores.push(
        `nodo taxonómico inexistente (${sentido.nodoCodigo}) referenciado por sentido ${sentido.codigo}`,
      );
      continue;
    }

    const existente = sentidosExistentes.get(sentido.codigo);
    if (!existente) {
      accionesSentidos.push({
        tipo: 'crear',
        nodoId: nodo.id,
        nivelNodo: nodo.nivel,
        sentido,
      });
    } else if (sentidoCambio(sentido, existente)) {
      accionesSentidos.push({
        tipo: 'actualizar',
        sentidoExistenteId: existente.id,
        nodoId: nodo.id,
        nivelNodo: nodo.nivel,
        sentido,
      });
    } else {
      accionesSentidos.push({
        tipo: 'sin_cambios',
        sentidoExistenteId: existente.id,
        nodoId: nodo.id,
        nivelNodo: nodo.nivel,
        sentido,
      });
    }
  }

  return {
    errores,
    accionesDescripciones,
    accionesSentidos,
    resumenSentidos: {
      crear: accionesSentidos.filter((a) => a.tipo === 'crear').length,
      actualizar: accionesSentidos.filter((a) => a.tipo === 'actualizar').length,
      sinCambios: accionesSentidos.filter((a) => a.tipo === 'sin_cambios').length,
    },
    resumenDescripciones: {
      actualizar: accionesDescripciones.filter((a) => a.tipo === 'actualizar').length,
      sinCambios: accionesDescripciones.filter((a) => a.tipo === 'sin_cambios').length,
    },
  };
}
