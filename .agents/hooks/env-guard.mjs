#!/usr/bin/env node
/**
 * Hook PreToolUse (env-guard): bloquea la lectura directa de archivos .env y .env.*
 * (excepto *.example) para mantener paridad de seguridad con opencode.json.
 */

import fs from 'node:fs';
import path from 'node:path';

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf8');
} catch {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

let payload = {};
try {
  payload = JSON.parse(raw || '{}');
} catch {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

const args = payload?.toolCall?.args ?? {};
const targetPath = String(args.AbsolutePath ?? args.TargetFile ?? '');
const base = path.basename(targetPath);

const isEnvSecret = (base === '.env' || base.startsWith('.env.')) && !base.endsWith('.example');

if (isEnvSecret) {
  process.stdout.write(
    JSON.stringify({
      decision: 'deny',
      reason:
        'Lectura bloqueada por política de seguridad del proyecto (paridad con opencode.json): los archivos .env contienen secretos. Consulta .env.example o .env.docker.example.',
    }),
  );
} else {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
}
