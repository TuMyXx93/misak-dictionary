/**
 * CLI: importación gobernada de la taxonomía (data/taxonomy/v1).
 *
 *   pnpm taxonomy:import                                  # dry-run (no escribe)
 *   pnpm taxonomy:import -- --apply --approved-by "Nombre" # aplica en una transacción
 *
 * Códigos de salida: 0 correcto · 1 errores de validación · 2 conflictos o uso incorrecto.
 */

import { resolve } from 'node:path';
import {
  ImportacionRechazada,
  type InformeImportacion,
  TaxonomyImportUseCase,
} from '../src/application/taxonomy/taxonomyImport.js';
import { prisma } from '../src/shared/config/prisma.js';

interface Argumentos {
  aplicar: boolean;
  aprobadoPor: string | undefined;
  directorio: string;
}

function leerArgumentos(argv: string[]): Argumentos {
  const indiceAprobador = argv.indexOf('--approved-by');
  const indiceDirectorio = argv.indexOf('--dir');
  const directorioPorDefecto = resolve(import.meta.dirname, '../../../data/taxonomy/v1');

  return {
    aplicar: argv.includes('--apply'),
    aprobadoPor: indiceAprobador === -1 ? undefined : argv[indiceAprobador + 1],
    directorio:
      indiceDirectorio === -1 ? directorioPorDefecto : resolve(argv[indiceDirectorio] ?? ''),
  };
}

function imprimirInforme(informe: InformeImportacion): void {
  const modo = informe.aplicado ? 'APLICADO' : 'DRY-RUN (sin cambios)';
  console.log(`\nTaxonomía — ${modo}`);
  console.log(`  huella SHA-256: ${informe.fuenteSha256}`);
  if (informe.batchId) console.log(`  lote: ${informe.batchId}`);
  console.log(
    `  nodos: crear ${informe.resumenNodos.crear} · actualizar ${informe.resumenNodos.actualizar} · ` +
      `sin cambios ${informe.resumenNodos.sinCambios} · conflicto ${informe.resumenNodos.conflicto}`,
  );
  console.log(`  filas legadas (demo) a retirar: ${informe.legadosARetirar}`);
  console.log(
    `  botones del home: ${informe.botones.filter((b) => b.tipo === 'actualizar').length} a actualizar`,
  );

  if (informe.cambiosOrtograficos.length > 0) {
    console.log(`\n  Normalización ortográfica (${informe.cambiosOrtograficos.length}):`);
    for (const cambio of informe.cambiosOrtograficos) {
      console.log(`    ${cambio.codigo}: "${cambio.antes}" → "${cambio.despues}"`);
    }
  }
  for (const conflicto of informe.conflictos) {
    console.log(`  CONFLICTO ${conflicto.nodo.codigo}: ${conflicto.motivo}`);
  }
  for (const error of informe.errores) {
    console.log(`  ERROR ${error}`);
  }
  if (informe.resultado) {
    const r = informe.resultado;
    console.log(
      `\n  Resultado: creadas ${r.creadas}, actualizadas ${r.actualizadas}, ` +
        `retiradas ${r.retiradas} (palabras demo ${r.palabrasRetiradas}), botones ${r.botonesActualizados}`,
    );
  }
}

async function main(): Promise<number> {
  const argumentos = leerArgumentos(process.argv.slice(2));
  const caso = new TaxonomyImportUseCase();

  try {
    const informe = await caso.ejecutar({
      taxonomiaPath: resolve(argumentos.directorio, 'taxonomia.yaml'),
      botonesPath: resolve(argumentos.directorio, 'home-slots.yaml'),
      aplicar: argumentos.aplicar,
      aprobadoPor: argumentos.aprobadoPor,
    });
    imprimirInforme(informe);
    if (informe.errores.length > 0) return 1;
    return 0;
  } catch (error) {
    if (error instanceof ImportacionRechazada) {
      imprimirInforme(error.informe);
      console.error(`\n✖ ${error.message}. No se escribió nada.`);
      return error.informe.errores.length > 0 ? 1 : 2;
    }
    console.error(error instanceof Error ? error.message : error);
    return 2;
  }
}

main()
  .then((codigo) => {
    process.exitCode = codigo;
  })
  .finally(() => prisma.$disconnect());
