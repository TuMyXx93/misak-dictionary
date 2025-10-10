#!/usr/bin/env node

/**
 * 🔒 Script de Validación de Package Manager
 *
 * Este script bloquea la ejecución de npm/yarn y fuerza el uso de pnpm.
 * Previene conflictos que causan congelamiento del sistema.
 *
 * Uso: Se ejecuta automáticamente en preinstall
 */

const packageJson = require('../package.json');

// Obtener el package manager usado (npm_execpath contiene la ruta del ejecutable)
const userAgent = process.env.npm_config_user_agent;
const execPath = process.env.npm_execpath || '';

// Detectar el package manager
let packageManager = 'unknown';
if (userAgent) {
  if (userAgent.includes('pnpm')) {
    packageManager = 'pnpm';
  } else if (userAgent.includes('yarn')) {
    packageManager = 'yarn';
  } else if (userAgent.includes('npm')) {
    packageManager = 'npm';
  }
}

// Validar que sea pnpm
if (packageManager !== 'pnpm') {
  console.error('\n╔════════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ ERROR: Package Manager Incorrecto                         ║');
  console.error('╠════════════════════════════════════════════════════════════════╣');
  console.error('║                                                                ║');
  console.error('║  Este proyecto SOLO funciona con pnpm.                        ║');
  console.error('║  Usar npm o yarn causa conflictos que congelan el sistema.    ║');
  console.error('║                                                                ║');
  console.error(
    `║  Package Manager Requerido: pnpm@${packageJson.packageManager.split('@')[1] || '10.17.1'}               ║`,
  );
  console.error(`║  Package Manager Detectado:  ${packageManager.padEnd(31)} ║`);
  console.error('║                                                                ║');
  console.error('╠════════════════════════════════════════════════════════════════╣');
  console.error('║  📦 Instalación de pnpm:                                      ║');
  console.error('║                                                                ║');
  console.error('║  npm install -g pnpm@10.17.1                                  ║');
  console.error('║  # o                                                           ║');
  console.error('║  curl -fsSL https://get.pnpm.io/install.sh | sh -             ║');
  console.error('║                                                                ║');
  console.error('║  Luego ejecuta:                                                ║');
  console.error('║  pnpm install                                                  ║');
  console.error('║                                                                ║');
  console.error('╚════════════════════════════════════════════════════════════════╝\n');

  process.exit(1);
}

console.log('✅ Package Manager válido: pnpm');
