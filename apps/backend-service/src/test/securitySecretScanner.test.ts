/**
 * Security Secret Scanner Test (T-029, R-028)
 * Verifica que el código fuente del backend no contenga secretos, contraseñas
 * débiles harcodeadas ni credenciales en texto claro.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PATRONES_PROHIBIDOS = [
  /password\s*[:=]\s*['"][a-zA-Z0-9_]{3,20}['"]/i,
  /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
  /bearer\s+ey[a-zA-Z0-9_\-\.]{30,}/i,
  /BEGIN\s+PRIVATE\s+KEY/,
  /postgres:\/\/[^:]+:[^@]+@(?!(localhost|127\.0\.0\.1))/i,
];

// Archivos de prueba o mocks permitidos que usan tokens sintéticos ficticios
const ARCHIVOS_IGNORADOS = new Set([
  'securitySecretScanner.test.ts',
  'setup.ts',
  'adminSentidoRoutes.test.ts',
  'adminGovernanceRoutes.test.ts',
  'adminMaintenanceRoutes.test.ts',
  'AuthController.test.ts',
  'TokenService.test.ts',
  'RootBootstrapService.test.ts',
  'PasswordService.test.ts',
  'LoginUseCase.test.ts',
  'ChangePasswordUseCase.test.ts',
]);

function obtenerArchivosTs(directorio: string): string[] {
  const archivos: string[] = [];
  const items = readdirSync(directorio);

  for (const item of items) {
    const fullPath = join(directorio, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git' && item !== 'generated') {
        archivos.push(...obtenerArchivosTs(fullPath));
      }
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      archivos.push(fullPath);
    }
  }

  return archivos;
}

describe('Security Secret Scanner (R-028)', () => {
  const raizSrc = resolve(import.meta.dirname, '..');
  const archivos = obtenerArchivosTs(raizSrc);

  it('no detecta contraseñas en claro ni secretos de producción en el código fuente de producción', () => {
    const hallazgos: Array<{ archivo: string; linea: number; patron: string }> = [];

    for (const archivo of archivos) {
      const nombreArchivo = archivo.split('/').pop() ?? '';
      if (ARCHIVOS_IGNORADOS.has(nombreArchivo) || nombreArchivo.endsWith('.test.ts')) {
        continue;
      }

      const contenido = readFileSync(archivo, 'utf-8');
      const lineas = contenido.split('\n');

      for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        for (const patron of PATRONES_PROHIBIDOS) {
          if (patron.test(linea)) {
            hallazgos.push({
              archivo,
              linea: i + 1,
              patron: patron.toString(),
            });
          }
        }
      }
    }

    expect(hallazgos).toEqual([]);
  });

  it('RootBootstrapService no contiene contraseñas débiles por defecto harcodeadas', () => {
    const bootstrapPath = resolve(raizSrc, 'application/use-cases/auth/RootBootstrapService.ts');
    const contenido = readFileSync(bootstrapPath, 'utf-8');

    expect(contenido).not.toContain('admin123');
    expect(contenido).not.toContain('password123');
    expect(contenido).not.toContain('misak123');
    expect(contenido).not.toContain('supersecret');
    expect(contenido).toContain('mustChangePassword');
  });
});
