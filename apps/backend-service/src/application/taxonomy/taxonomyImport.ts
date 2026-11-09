/**
 * Caso de uso: importación gobernada de la taxonomía versionada.
 * - Dry-run por defecto: calcula el plan sin escribir nada.
 * - Apply: exige aprobador y aborta si hay errores de validación o conflictos.
 * La fuente de verdad es el YAML revisado (data/taxonomy/vN), nunca el PDF.
 */

import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import {
  PREFIJO_LEGADO,
  TaxonomyRepository,
} from '../../infrastructure/repositories/TaxonomyRepository.js';
import {
  type AccionBoton,
  type AccionNodo,
  type CambioOrtografico,
  compararBotones,
  compararPlan,
  construirPlan,
} from './taxonomyPlan.js';
import { botonesHomeSchema, taxonomiaSchema } from './taxonomySchema.js';

export interface OpcionesImportacion {
  taxonomiaPath: string;
  botonesPath: string;
  aplicar: boolean;
  aprobadoPor?: string | undefined;
}

export interface ResumenNodos {
  crear: number;
  actualizar: number;
  sinCambios: number;
  conflicto: number;
}

export interface InformeImportacion {
  aplicado: boolean;
  batchId: string | null;
  fuenteSha256: string;
  errores: string[];
  resumenNodos: ResumenNodos;
  conflictos: AccionNodo[];
  cambiosOrtograficos: CambioOrtografico[];
  legadosARetirar: number;
  botones: AccionBoton[];
  resultado: {
    retiradas: number;
    palabrasRetiradas: number;
    creadas: number;
    actualizadas: number;
    botonesActualizados: number;
  } | null;
}

export class ImportacionRechazada extends Error {
  constructor(
    message: string,
    readonly informe: InformeImportacion,
  ) {
    super(message);
    this.name = 'ImportacionRechazada';
  }
}

export class TaxonomyImportUseCase {
  constructor(private readonly repository = new TaxonomyRepository()) {}

  async ejecutar(opciones: OpcionesImportacion): Promise<InformeImportacion> {
    if (opciones.aplicar && (opciones.aprobadoPor ?? '').trim() === '') {
      throw new Error('Aplicar requiere --approved-by <nombre del aprobador>');
    }

    const textoTaxonomia = await readFile(opciones.taxonomiaPath, 'utf8');
    const textoBotones = await readFile(opciones.botonesPath, 'utf8');
    const fuenteSha256 = createHash('sha256')
      .update(textoTaxonomia)
      .update(textoBotones)
      .digest('hex');

    const taxonomia = taxonomiaSchema.safeParse(parse(textoTaxonomia));
    const botones = botonesHomeSchema.safeParse(parse(textoBotones));

    const erroresEsquema = [
      ...(taxonomia.success ? [] : taxonomia.error.issues.map(formatearIssue('taxonomía'))),
      ...(botones.success ? [] : botones.error.issues.map(formatearIssue('botones'))),
    ];

    const informeBase = {
      fuenteSha256,
      cambiosOrtograficos: [] as CambioOrtografico[],
    };

    if (!taxonomia.success || !botones.success) {
      return this.cerrar(opciones, {
        ...informeBase,
        aplicado: false,
        batchId: null,
        errores: erroresEsquema,
        resumenNodos: { crear: 0, actualizar: 0, sinCambios: 0, conflicto: 0 },
        conflictos: [],
        legadosARetirar: 0,
        botones: [],
        resultado: null,
      });
    }

    const plan = construirPlan(taxonomia.data);
    const existentes = await this.repository.cargarActivos();
    const legados = existentes.filter((fila) => fila.codigo.startsWith(PREFIJO_LEGADO));
    const activos = existentes.filter((fila) => !fila.codigo.startsWith(PREFIJO_LEGADO));
    const acciones = compararPlan(plan.nodos, activos);
    const conflictos = acciones.filter((a) => a.tipo === 'conflicto');
    const botonesActuales = await this.repository.cargarBotones();
    const accionesBotones = compararBotones(botones.data, botonesActuales);

    const errores = [...erroresEsquema, ...plan.errores];
    const informe: InformeImportacion = {
      ...informeBase,
      cambiosOrtograficos: plan.cambiosOrtograficos,
      aplicado: false,
      batchId: null,
      errores,
      resumenNodos: {
        crear: acciones.filter((a) => a.tipo === 'crear').length,
        actualizar: acciones.filter((a) => a.tipo === 'actualizar').length,
        sinCambios: acciones.filter((a) => a.tipo === 'sin_cambios').length,
        conflicto: conflictos.length,
      },
      conflictos,
      legadosARetirar: legados.length,
      botones: accionesBotones,
      resultado: null,
    };

    if (!opciones.aplicar) {
      return informe;
    }

    if (errores.length > 0 || conflictos.length > 0) {
      throw new ImportacionRechazada('La importación tiene errores o conflictos', informe);
    }

    const batchId = randomUUID();
    const resultado = await this.repository.aplicar({
      batchId,
      aprobadoPor: opciones.aprobadoPor ?? '',
      fuenteSha256,
      retirar: legados.length > 0,
      nodos: acciones
        .filter((a) => a.tipo === 'crear' || a.tipo === 'actualizar')
        .map((a) => ({
          accion: a.tipo as 'crear' | 'actualizar',
          nodo: a.nodo,
        })),
      botones: botones.data.botones.map((boton, indice) => ({
        clave: boton.clave,
        etiqueta: boton.etiqueta,
        posicion: indice + 1,
        campoCodigo: boton.campo,
      })),
    });

    return { ...informe, aplicado: true, batchId, resultado };
  }

  private cerrar(opciones: OpcionesImportacion, informe: InformeImportacion): InformeImportacion {
    if (opciones.aplicar && informe.errores.length > 0) {
      throw new ImportacionRechazada('El archivo de taxonomía no es válido', informe);
    }
    return informe;
  }
}

function formatearIssue(origen: string) {
  return (issue: { path: PropertyKey[]; message: string }) =>
    `${origen} ${issue.path.map(String).join('.') || '(raíz)'}: ${issue.message}`;
}
