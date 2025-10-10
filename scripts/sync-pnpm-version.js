#!/usr/bin/env node

/**
 * 🔄 Script de Sincronización de Versión pnpm
 *
 * Este script actualiza automáticamente la versión de pnpm en package.json
 * para que coincida con la versión instalada globalmente.
 *
 * Uso: node scripts/sync-pnpm-version.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Obtener versión global de pnpm
  const globalVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();

  // Leer package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Versión actual en package.json
  const currentVersion = packageJson.packageManager?.split('@')[1];

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🔄 Sincronización de Versión pnpm                       ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Versión Global:      ${globalVersion.padEnd(30)} ║`);
  console.log(`║  Versión en Proyecto: ${(currentVersion || 'no definida').padEnd(30)} ║`);
  console.log('╠═══════════════════════════════════════════════════════════╣');

  if (currentVersion === globalVersion) {
    console.log('║  ✅ Las versiones ya están sincronizadas                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    process.exit(0);
  }

  // Actualizar package.json
  packageJson.packageManager = `pnpm@${globalVersion}`;
  packageJson.engines = packageJson.engines || {};
  packageJson.engines.pnpm = `>=${globalVersion}`;

  // Guardar cambios
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

  console.log('║  ✅ package.json actualizado correctamente              ║');
  console.log('║                                                           ║');
  console.log('║  Cambios realizados:                                      ║');
  console.log(
    `║  packageManager: "pnpm@${globalVersion}"${' '.repeat(Math.max(0, 26 - globalVersion.length))}║`,
  );
  console.log(
    `║  engines.pnpm:   ">=${globalVersion}"${' '.repeat(Math.max(0, 28 - globalVersion.length))}║`,
  );
  console.log('║                                                           ║');
  console.log('║  Ejecuta: pnpm install                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
} catch (error) {
  console.error('\n❌ Error al sincronizar versión:', error.message);
  process.exit(1);
}
