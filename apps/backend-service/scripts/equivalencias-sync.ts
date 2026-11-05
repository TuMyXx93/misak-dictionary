/**
 * Script CLI: Sincronización de Equivalencias Bilingües
 * Spec 012 / ADR-0008: Puebla e hidrata equivalencias_bilingues desde el corpus v1 y el YAML curado.
 */

import { syncEquivalenciasBilingues } from '../src/application/lexicon/equivalenciasBilingues.js';
import { prisma } from '../src/shared/config/prisma.js';

async function main() {
  console.log('[equivalencias:sync] Iniciando sincronización de matriz bilingüe...');
  const result = await syncEquivalenciasBilingues(prisma);
  console.log(
    `[equivalencias:sync] Sincronización exitosa: ${result.totalSentidos} sentidos analizados, ${result.totalEquivalencias} equivalencias en BD.`,
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('[equivalencias:sync] Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
