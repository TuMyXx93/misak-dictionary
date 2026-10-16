/**
 * CLI: importación gobernada del léxico (data/lexicon/v1/lexico.yaml).
 *
 *   pnpm lexicon:import                                    # dry-run (no escribe)
 *   pnpm lexicon:import -- --apply --approved-by "Nombre"  # aplica en una transacción
 *
 * Códigos de salida: 0 correcto · 1 errores de validación · 2 uso incorrecto.
 */

import { resolve } from 'node:path';
import {
  ImportacionLexicoRechazada,
  type InformeImportacionLexico,
  LexiconImportUseCase,
} from '../src/application/lexicon/lexiconImport.js';
import { prisma } from '../src/shared/config/prisma.js';

interface Argumentos {
  aplicar: boolean;
  aprobadoPor: string | undefined;
  archivo: string;
}

function leerArgumentos(argv: string[]): Argumentos {
  const indiceAprobador = argv.indexOf('--approved-by');
  const indiceArchivo = argv.indexOf('--file');
  const archivoPorDefecto = resolve(import.meta.dirname, '../../../data/lexicon/v1/lexico.yaml');

  return {
    aplicar: argv.includes('--apply'),
    aprobadoPor: indiceAprobador === -1 ? undefined : argv[indiceAprobador + 1],
    archivo: indiceArchivo === -1 ? archivoPorDefecto : resolve(argv[indiceArchivo + 1] ?? ''),
  };
}

function imprimirInforme(informe: InformeImportacionLexico): void {
  const modo = informe.aplicado ? 'APLICADO' : 'DRY-RUN (sin cambios)';
  console.log(`\nLéxico Sentido + Formas — ${modo}`);
  console.log(`  huella SHA-256: ${informe.fuenteSha256}`);
  if (informe.batchId) console.log(`  lote: ${informe.batchId}`);
  console.log(
    `  descripciones de nodos: actualizar ${informe.resumenDescripciones.actualizar} · ` +
      `sin cambios ${informe.resumenDescripciones.sinCambios}`,
  );
  console.log(
    `  sentidos léxicos: crear ${informe.resumenSentidos.crear} · ` +
      `actualizar ${informe.resumenSentidos.actualizar} · ` +
      `sin cambios ${informe.resumenSentidos.sinCambios}`,
  );
  console.log(`  duplicados exactos colapsados en fuente: ${informe.duplicadosColapsados}`);
  console.log(
    `  observaciones editoriales preservadas: ${informe.observacionesEditoriales.length}`,
  );
  console.log(`  palabras demo legadas a retirar: ${informe.palabrasDemoARetirar}`);

  if (informe.resultado) {
    console.log(
      `  resultado: ${informe.resultado.descripcionesActualizadas} descripciones actualizadas · ` +
        `${informe.resultado.sentidosCreados} sentidos creados · ` +
        `${informe.resultado.sentidosActualizados} sentidos actualizados · ` +
        `${informe.resultado.formasPersistidas} formas namtrik persistidas · ` +
        `${informe.resultado.palabrasDemoRetiradas} palabras demo retiradas`,
    );
  }

  for (const error of informe.errores) {
    console.log(`  ERROR: ${error}`);
  }
}

async function main(): Promise<void> {
  const args = leerArgumentos(process.argv.slice(2));
  const useCase = new LexiconImportUseCase();

  try {
    const informe = await useCase.ejecutar({
      lexicoPath: args.archivo,
      aplicar: args.aplicar,
      aprobadoPor: args.aprobadoPor,
    });
    imprimirInforme(informe);
    if (informe.errores.length > 0) process.exitCode = 1;
  } catch (error) {
    if (error instanceof ImportacionLexicoRechazada) {
      imprimirInforme(error.informe);
      console.error(`\nRechazado: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
