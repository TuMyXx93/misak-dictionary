/**
 * Caso de uso: importación gobernada del corpus léxico versionado (Spec 005).
 * - Dry-run por defecto: valida con Zod y calcula el plan sin escribir nada.
 * - Apply: exige --approved-by y ejecuta en una única transacción con registro en audit_log.
 */

import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import {
  LexiconRepository,
  type ResultadoAplicacionLexico,
} from '../../infrastructure/repositories/LexiconRepository.js';
import { construirPlanLexico } from './lexiconPlan.js';
import { lexicoSchema } from './lexiconSchema.js';

export interface OpcionesImportacionLexico {
  lexicoPath: string;
  aplicar: boolean;
  aprobadoPor?: string | undefined;
}

export interface InformeImportacionLexico {
  aplicado: boolean;
  batchId: string | null;
  fuenteSha256: string;
  errores: string[];
  duplicadosColapsados: number;
  observacionesEditoriales: { codigo: string; observacion: string }[];
  resumenDescripciones: {
    actualizar: number;
    sinCambios: number;
  };
  resumenSentidos: {
    crear: number;
    actualizar: number;
    sinCambios: number;
  };
  palabrasDemoARetirar: number;
  resultado: ResultadoAplicacionLexico | null;
}

export class ImportacionLexicoRechazada extends Error {
  constructor(
    message: string,
    readonly informe: InformeImportacionLexico,
  ) {
    super(message);
    this.name = 'ImportacionLexicoRechazada';
  }
}

export class LexiconImportUseCase {
  constructor(private readonly repository = new LexiconRepository()) {}

  async ejecutar(opciones: OpcionesImportacionLexico): Promise<InformeImportacionLexico> {
    if (opciones.aplicar && (opciones.aprobadoPor ?? '').trim() === '') {
      throw new Error('Aplicar requiere --approved-by <nombre del aprobador>');
    }

    const textoLexico = await readFile(opciones.lexicoPath, 'utf8');
    const fuenteSha256 = createHash('sha256').update(textoLexico).digest('hex');

    const parseado = lexicoSchema.safeParse(parse(textoLexico));
    if (!parseado.success) {
      const erroresEsquema = parseado.error.issues.map(
        (issue) => `léxico ${issue.path.join('.') || '<raíz>'}: ${issue.message}`,
      );
      const informeFallido: InformeImportacionLexico = {
        aplicado: false,
        batchId: null,
        fuenteSha256,
        errores: erroresEsquema,
        duplicadosColapsados: 0,
        observacionesEditoriales: [],
        resumenDescripciones: { actualizar: 0, sinCambios: 0 },
        resumenSentidos: { crear: 0, actualizar: 0, sinCambios: 0 },
        palabrasDemoARetirar: 0,
        resultado: null,
      };
      if (opciones.aplicar) {
        throw new ImportacionLexicoRechazada(
          'Validación de esquema léxico fallida',
          informeFallido,
        );
      }
      return informeFallido;
    }

    const [nodosActivos, sentidosExistentes, palabrasDemoARetirar] = await Promise.all([
      this.repository.cargarNodosActivos(),
      this.repository.cargarSentidosActivos(),
      this.repository.contarPalabrasDemoActivas(),
    ]);

    const plan = construirPlanLexico(parseado.data, nodosActivos, sentidosExistentes);
    const observacionesEditoriales = parseado.data.sentidos
      .filter((s) => s.observacionEditorial !== undefined)
      .map((s) => ({
        codigo: s.codigo,
        observacion: s.observacionEditorial ?? '',
      }));

    const informe: InformeImportacionLexico = {
      aplicado: false,
      batchId: null,
      fuenteSha256,
      errores: plan.errores,
      duplicadosColapsados: parseado.data.fuente.duplicadosColapsados,
      observacionesEditoriales,
      resumenDescripciones: plan.resumenDescripciones,
      resumenSentidos: plan.resumenSentidos,
      palabrasDemoARetirar,
      resultado: null,
    };

    if (!opciones.aplicar || plan.errores.length > 0) {
      if (opciones.aplicar && plan.errores.length > 0) {
        throw new ImportacionLexicoRechazada('El plan léxico contiene errores', informe);
      }
      return informe;
    }

    const batchId = randomUUID();
    const hayCambios =
      plan.resumenDescripciones.actualizar > 0 ||
      plan.resumenSentidos.crear > 0 ||
      plan.resumenSentidos.actualizar > 0 ||
      palabrasDemoARetirar > 0;

    const resultado = hayCambios
      ? await this.repository.aplicarEnTransaccion({
          batchId,
          aprobadoPor: (opciones.aprobadoPor ?? '').trim(),
          fuenteSha256,
          duplicadosColapsados: parseado.data.fuente.duplicadosColapsados,
          descripciones: plan.accionesDescripciones,
          sentidos: plan.accionesSentidos,
        })
      : {
          descripcionesActualizadas: 0,
          sentidosCreados: 0,
          sentidosActualizados: 0,
          formasPersistidas: 0,
          palabrasDemoRetiradas: 0,
        };

    return {
      ...informe,
      aplicado: true,
      batchId: hayCambios ? batchId : null,
      resultado,
    };
  }
}
