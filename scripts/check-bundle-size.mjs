#!/usr/bin/env node
/**
 * scripts/check-bundle-size.mjs
 * Spec 006 (R-023) — Falla si el chunk principal (index-*.js) crece > 5 % respecto a v0.4.0-alpha.0.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Baseline v0.4.0-alpha.0: 242,347 bytes
const BASELINE_BYTES = 242_347;
const MAX_GROWTH_PERCENT = 5;
const MAX_ALLOWED_BYTES = Math.round(BASELINE_BYTES * (1 + MAX_GROWTH_PERCENT / 100));

const assetsDir = join(process.cwd(), 'apps/web-client/dist/assets');

let files;
try {
  files = readdirSync(assetsDir);
} catch (error) {
  console.error(`❌ Error al leer el directorio de assets: ${assetsDir}`);
  console.error(error.message);
  process.exit(1);
}

const mainChunkFile = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));

if (!mainChunkFile) {
  console.error('❌ No se encontró el chunk principal index-*.js en dist/assets/');
  process.exit(1);
}

const mainChunkPath = join(assetsDir, mainChunkFile);
const sizeBytes = statSync(mainChunkPath).size;
const sizeKb = (sizeBytes / 1024).toFixed(2);
const baselineKb = (BASELINE_BYTES / 1024).toFixed(2);
const maxAllowedKb = (MAX_ALLOWED_BYTES / 1024).toFixed(2);
const growthPercent = (((sizeBytes - BASELINE_BYTES) / BASELINE_BYTES) * 100).toFixed(2);

console.log('📦 Bundle Size Check (Spec 006 R-023)');
console.log('--------------------------------------');
console.log(`Chunk principal:     ${mainChunkFile}`);
console.log(`Tamaño actual:       ${sizeBytes} bytes (${sizeKb} kB)`);
console.log(`Baseline (v0.4.0):   ${BASELINE_BYTES} bytes (${baselineKb} kB)`);
console.log(
  `Límite (+${MAX_GROWTH_PERCENT} %):      ${MAX_ALLOWED_BYTES} bytes (${maxAllowedKb} kB)`,
);
console.log(`Variación:           ${growthPercent > 0 ? `+${growthPercent}` : growthPercent} %`);

if (sizeBytes > MAX_ALLOWED_BYTES) {
  console.error(
    `❌ VIOLACIÓN R-023: El chunk principal creció ${growthPercent} %, superando el límite del ${MAX_GROWTH_PERCENT} %. El código del panel admin debe cargarse en chunks bajo demanda.`,
  );
  process.exit(1);
}

console.log(
  '✅ R-023 cumplido: El chunk principal se mantiene dentro del umbral de crecimiento permitido.',
);
