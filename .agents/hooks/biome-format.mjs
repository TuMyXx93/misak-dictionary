#!/usr/bin/env node
/**
 * Hook PostToolUse (biome-format): formatea con Biome los archivos editados
 * por write_to_file, replace_file_content o multi_replace_file_content.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SUPPORTED_EXTS = new Set([
  '.js',
  '.ts',
  '.cjs',
  '.mjs',
  '.jsx',
  '.tsx',
  '.json',
  '.jsonc',
  '.css',
]);

try {
  const raw = fs.readFileSync(0, 'utf8');
  const payload = JSON.parse(raw || '{}');
  const targetFile = String(payload?.toolCall?.args?.TargetFile ?? '');
  const ext = path.extname(targetFile);

  if (targetFile && SUPPORTED_EXTS.has(ext) && fs.existsSync(targetFile)) {
    const repoRoot = path.resolve(import.meta.dirname, '../..');
    const biomeBin = path.join(repoRoot, 'node_modules/.bin/biome');
    if (fs.existsSync(biomeBin)) {
      execFileSync(biomeBin, ['format', '--write', targetFile], {
        cwd: repoRoot,
        stdio: 'ignore',
        timeout: 8000,
      });
    }
  }
} catch {
  // No bloquear el loop del agente si el formateo falla
}

process.stdout.write('{}');
