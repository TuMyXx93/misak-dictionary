#!/usr/bin/env node
/**
 * Sincronizador determinista .opencode/ -> .agents/ para Antigravity (app, CLI e IDE).
 *
 * Fuente canónica (Decisión D1 = Opción A):
 *   - .opencode/agents/*.md
 *   - .opencode/commands/*.md
 *   - .opencode/skills/*\/SKILL.md
 *
 * Uso:
 *   node scripts/agents/sync-antigravity.mjs          # Genera/actualiza .agents/
 *   node scripts/agents/sync-antigravity.mjs --check  # Valida paridad sin escribir (CI / hooks)
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const OPENCODE_DIR = path.join(REPO_ROOT, '.opencode');
const AGENTS_DIR = path.join(REPO_ROOT, '.agents');
const CHECK_ONLY = process.argv.includes('--check');

/**
 * Mapeo de nombres de commands de OpenCode a skills/slash-commands en Antigravity.
 * Los tres comandos del ciclo SDD usan el prefijo `sdd-` para evitar colisión
 * con los comandos nativos `/plan` y `/tasks` de Antigravity app y CLI.
 */
const COMMAND_SKILL_MAP = {
  specify: 'sdd-specify',
  plan: 'sdd-plan',
  tasks: 'sdd-tasks',
  'version-gate': 'version-gate',
  'docs-gate': 'docs-gate',
  'merge-gate': 'merge-gate',
  'version-bump': 'version-bump',
  'gen-component': 'gen-component',
  'gen-usecase': 'gen-usecase',
  'gen-test': 'gen-test',
  'db-migrate': 'db-migrate',
  'check-arch': 'check-arch',
  review: 'review',
};

/**
 * Herramientas de solo lectura permitidas para el subagente `reviewer` en Antigravity.
 */
const READ_ONLY_TOOLS = [
  'view_file',
  'view_file_outline',
  'view_code_item',
  'list_dir',
  'grep_search',
  'find_by_name',
  'run_command',
  'call_mcp_tool',
  'list_resources',
  'read_resource',
];

/**
 * Extrae frontmatter YAML simple y el cuerpo Markdown de un archivo.
 * @param {string} raw
 * @returns {{ frontmatter: string, body: string }}
 */
function splitFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/);
  if (!match) {
    return { frontmatter: '', body: normalized.trim() };
  }
  return {
    frontmatter: match[1] ?? '',
    body: (match[2] ?? '').trim(),
  };
}

/**
 * Extrae el campo `description` del frontmatter YAML (soporta bloque `>` o línea simple).
 * @param {string} fm
 * @returns {string}
 */
function parseDescription(fm) {
  const lines = fm.split('\n');
  const descLines = [];
  let inBlock = false;

  for (const line of lines) {
    if (!inBlock) {
      const m = line.match(/^description:\s*(.*)$/);
      if (m) {
        const inline = (m[1] ?? '').trim();
        if (inline === '>' || inline === '|-' || inline === '|') {
          inBlock = true;
        } else if (inline.length > 0) {
          return inline.replace(/^['"]|['"]$/g, '');
        }
      }
    } else if (/^\s{2,}\S/.test(line)) {
      descLines.push(line.trim());
    } else {
      break;
    }
  }

  return descLines.join(' ').trim();
}

/**
 * Extrae un escalar simple `key: value` del frontmatter YAML.
 * @param {string} fm
 * @param {string} key
 * @returns {string | null}
 */
function parseScalar(fm, key) {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = fm.match(regex);
  return match?.[1] ? match[1].trim() : null;
}

/**
 * Transforma un agente `.opencode/agents/<name>.md` al formato `.agents/agents/<name>/agent.md`.
 * @param {string} agentName
 * @param {string} rawContent
 * @returns {string}
 */
function transformAgent(agentName, rawContent) {
  const { frontmatter, body } = splitFrontmatter(rawContent);
  const description = parseDescription(frontmatter);
  const isReadOnly = agentName === 'reviewer' || /write:\s*false/.test(frontmatter);

  const fmLines = ['---', `name: ${agentName}`, 'description: >-', `  ${description}`];

  if (isReadOnly) {
    fmLines.push('tools:');
    for (const tool of READ_ONLY_TOOLS) {
      fmLines.push(`  - ${tool}`);
    }
  }

  fmLines.push(
    'model: inherit',
    'subagent: true',
    'mainAgent: true',
    'commandExecutionPolicy: sandbox',
    '---',
  );

  const adaptedBody = body.replace(
    /- Agentes \(`\.opencode\/agents\/\*\.md`\)\n- Skills \(`\.opencode\/skills\/<nombre>\/SKILL\.md`\)\n- Commands \(`\.opencode\/commands\/\*\.md`\)\n- Tools \(`\.opencode\/tools\/\*\.ts`\)/,
    '- Agentes (`.opencode/agents/*.md` -> sincronizados a `.agents/agents/<nombre>/agent.md`)\n- Skills (`.opencode/skills/<nombre>/SKILL.md` -> expuestos en `.agents/skills.json`)\n- Commands (`.opencode/commands/*.md` -> sincronizados a `.agents/skills/<nombre>/SKILL.md`)\n- Sincronización multi-entorno (`pnpm agents:sync` / `node scripts/agents/sync-antigravity.mjs`)',
  );

  return `${fmLines.join('\n')}\n\n${adaptedBody}\n`;
}

/**
 * Transforma un command `.opencode/commands/<cmd>.md` en `.agents/skills/<skill>/SKILL.md`.
 * @param {string} cmdName
 * @param {string} skillName
 * @param {string} rawContent
 * @returns {string}
 */
function transformCommandToSkill(cmdName, skillName, rawContent) {
  const { frontmatter, body } = splitFrontmatter(rawContent);
  const baseDescription = parseDescription(frontmatter);
  const targetAgent = parseScalar(frontmatter, 'agent');
  const isSubtask = parseScalar(frontmatter, 'subtask') === 'true';

  const fullDescription = `${baseDescription}. Invocar con /${skillName} (equivalente a /${cmdName} en OpenCode).`;

  const executionNotes = [
    '> [!NOTE]',
    `> **Ejecución en Antigravity (app y CLI)**: Invocado mediante \`/${skillName}\`.`,
    '> - `$1` corresponde al primer argumento pasado tras el comando (o infiérelo/pregúntalo si se omite).',
    '> - `$ARGUMENTS` corresponde al texto completo de argumentos proporcionado por la persona usuaria.',
  ];

  if (targetAgent) {
    const delegationMode = isSubtask
      ? `Puedes ejecutar este flujo directamente o delegarlo al subagente \`${targetAgent}\` mediante \`invoke_subagent\` (\`TypeName: "${targetAgent}"\`, \`Model: "inherit"\`).`
      : `Aplica las convenciones del agente especialista \`${targetAgent}\` (o delégalo con \`invoke_subagent\` si forma parte de un flujo paralelo).`;
    executionNotes.push(`> - **Agente asociado**: \`${targetAgent}\`. ${delegationMode}`);
  }

  const transformedBody = body
    .replace(/!`([^`]+)`/g, 'Ejecuta el comando:\n```sh\n$1\n```')
    .replace(/`\/specify`/g, '`/sdd-specify` (`/specify` en OpenCode)')
    .replace(/`\/plan`/g, '`/sdd-plan` (`/plan` en OpenCode)')
    .replace(/`\/tasks`/g, '`/sdd-tasks` (`/tasks` en OpenCode)');

  return [
    '---',
    `name: ${skillName}`,
    'description: >-',
    `  ${fullDescription}`,
    '---',
    '',
    `# Skill: /${skillName}`,
    '',
    executionNotes.join('\n'),
    '',
    transformedBody,
    '',
  ].join('\n');
}

/**
 * Construye el meta-skill `agent-creator` adaptado para mantener paridad OpenCode + Antigravity.
 * @param {string} rawOpenCodeSkill
 * @returns {string}
 */
function buildAgentCreatorSkill(rawOpenCodeSkill) {
  const { body } = splitFrontmatter(rawOpenCodeSkill);
  const syncSection = `
## Sincronización Obligatoria con Antigravity (App, CLI e IDE)

El repositorio mantiene **\`.opencode/\` como fuente canónica** (Decisión D1) y proyecta automáticamente las personalizaciones hacia **\`.agents/\`** para Antigravity app, Antigravity CLI (\`agy\`) y Antigravity IDE.

Después de crear o modificar cualquier agente (\`.opencode/agents/*.md\`), skill (\`.opencode/skills/*/SKILL.md\`) o command (\`.opencode/commands/*.md\`):

1. Ejecuta el sincronizador:
   \`\`\`sh
   pnpm agents:sync
   \`\`\`
2. Verifica que la validación de paridad pase sin diferencias:
   \`\`\`sh
   pnpm agents:check
   \`\`\`
`;

  return [
    '---',
    'name: agent-creator',
    'description: >-',
    '  Meta-skill que enseña al agente architect a crear y mantener agentes, skills y commands',
    '  en .opencode/ y sincronizarlos automáticamente hacia .agents/ para Antigravity app y CLI.',
    '---',
    '',
    body,
    syncSection.trimEnd(),
    '',
  ].join('\n');
}

/**
 * Genera el mapa completo de archivos esperados bajo `.agents/` (rutas relativas a REPO_ROOT).
 * @returns {Map<string, string>}
 */
function buildExpectedFiles() {
  const files = new Map();

  // 1. .agents/skills.json (reutiliza .opencode/skills sin duplicar los 6 skills de dominio)
  files.set(
    '.agents/skills.json',
    [
      '{',
      '  "entries": [',
      '    {',
      '      "path": ".opencode/skills",',
      '      "exclude": ["agent-creator"]',
      '    }',
      '  ]',
      '}',
      '',
    ].join('\n'),
  );

  // 2. .agents/mcp_config.json (PostgreSQL aislado del proyecto sin credenciales en claro)
  files.set(
    '.agents/mcp_config.json',
    [
      '{',
      '  "mcpServers": {',
      '    "misak-postgres": {',
      '      "command": "sh",',
      '      "args": ["scripts/mcp/misak-postgres.sh"]',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n'),
  );

  // 3. .agents/hooks.json (paridad de seguridad .env, auto-format con Biome y recordatorio Engram)
  const hooksJson = {
    'env-guard': {
      PreToolUse: [
        {
          matcher: 'view_file',
          hooks: [
            {
              type: 'command',
              command: 'node ./hooks/env-guard.mjs',
              timeout: 5,
            },
          ],
        },
      ],
    },
    'biome-format': {
      PostToolUse: [
        {
          matcher: 'write_to_file|replace_file_content|multi_replace_file_content',
          hooks: [
            {
              type: 'command',
              command: 'node ./hooks/biome-format.mjs',
              timeout: 15,
            },
          ],
        },
      ],
    },
    'engram-protocol': {
      SessionStart: [
        {
          type: 'command',
          command: 'node ./hooks/session-start.mjs',
          timeout: 5,
        },
      ],
    },
  };
  files.set('.agents/hooks.json', `${JSON.stringify(hooksJson, null, 2)}\n`);

  // 4. .agents/rules/antigravity.md (puente de sintaxis OpenCode <-> Antigravity)
  const antigravityRule = `# Adaptador Antigravity (App, CLI e IDE) — Misak Dictionary

Esta regla complementa a \`AGENTS.md\` cuando operas desde **Antigravity app**, **Antigravity CLI (\`agy\`)** o **Antigravity IDE**:

## Equivalencias de Invocación

| Concepto en \`AGENTS.md\` | En OpenCode | En Antigravity (App / CLI) |
| ----------------------- | ----------- | -------------------------- |
| Delegar a especialista (\`@frontend\`, \`@backend\`, \`@reviewer\`, \`@tester\`, \`@devops\`, \`@architect\`) | Mención \`@<agent>\` | Tool \`invoke_subagent\` con \`TypeName: "<agent>"\` y \`Model: "inherit"\` (o cambiar de agente con \`/agents\` en CLI) |
| Spec-Driven Development: especificar | \`/specify <slug>\` | \`/sdd-specify <slug>\` (skill \`sdd-specify\`) |
| Spec-Driven Development: planificar | \`/plan <NNN-slug>\` | \`/sdd-plan <NNN-slug>\` (skill \`sdd-plan\`; evita colisión con \`/plan\` nativo) |
| Spec-Driven Development: tareas | \`/tasks <NNN-slug>\` | \`/sdd-tasks <NNN-slug>\` (skill \`sdd-tasks\`; evita colisión con \`/tasks\` nativo de CLI) |
| Gates y generadores (\`/version-gate\`, \`/docs-gate\`, \`/merge-gate\`, \`/version-bump\`, \`/gen-*\`, \`/db-migrate\`, \`/check-arch\`, \`/review\`) | Slash command directo | Slash command idéntico o lectura del skill homónimo en \`.agents/skills/\` |

## Servidores MCP del Proyecto

- \`engram\`: Memoria persistente del proyecto (\`project: "misak-dictionary"\`).
- \`context7\`: Documentación actualizada de librerías.
- \`misak-postgres\`: Base de datos PostgreSQL local del diccionario Misak (\`localhost:5434/misak_dictionary\`, vía \`scripts/mcp/misak-postgres.sh\`).

## Seguridad y Sincronización

- **Prohibido leer archivos \`.env\` / \`.env.*\`** (excepto \`*.example\`): bloqueado por el hook \`env-guard\`.
- **Fuente canónica de agentes/skills/commands**: \`.opencode/\`. Si modificas cualquier archivo en \`.opencode/\`, ejecuta \`pnpm agents:sync\` para actualizar \`.agents/\`.
`;
  files.set('.agents/rules/antigravity.md', antigravityRule);

  // 5. Agentes: .opencode/agents/<name>.md -> .agents/agents/<name>/agent.md
  const agentsSrcDir = path.join(OPENCODE_DIR, 'agents');
  const agentFiles = fs
    .readdirSync(agentsSrcDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  for (const file of agentFiles) {
    const agentName = path.basename(file, '.md');
    const raw = fs.readFileSync(path.join(agentsSrcDir, file), 'utf8');
    const converted = transformAgent(agentName, raw);
    files.set(`.agents/agents/${agentName}/agent.md`, converted);
  }

  // 6. Commands: .opencode/commands/<cmd>.md -> .agents/skills/<skill>/SKILL.md
  const commandsSrcDir = path.join(OPENCODE_DIR, 'commands');
  const commandFiles = fs
    .readdirSync(commandsSrcDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  for (const file of commandFiles) {
    const cmdName = path.basename(file, '.md');
    const skillName = COMMAND_SKILL_MAP[cmdName] ?? cmdName;
    const raw = fs.readFileSync(path.join(commandsSrcDir, file), 'utf8');
    const converted = transformCommandToSkill(cmdName, skillName, raw);
    files.set(`.agents/skills/${skillName}/SKILL.md`, converted);
  }

  // 7. Meta-skill agent-creator enriquecido
  const agentCreatorRaw = fs.readFileSync(
    path.join(OPENCODE_DIR, 'skills/agent-creator/SKILL.md'),
    'utf8',
  );
  files.set('.agents/skills/agent-creator/SKILL.md', buildAgentCreatorSkill(agentCreatorRaw));

  return files;
}

function main() {
  const expectedFiles = buildExpectedFiles();
  const drifts = [];

  for (const [relPath, expectedContent] of expectedFiles.entries()) {
    const absPath = path.join(REPO_ROOT, relPath);
    const currentContent = fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;

    if (currentContent !== expectedContent) {
      drifts.push(relPath);
      if (!CHECK_ONLY) {
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, expectedContent, 'utf8');
      }
    }
  }

  if (CHECK_ONLY) {
    if (drifts.length > 0) {
      console.error(
        `[agents:check] Desfase detectado entre .opencode/ y .agents/ (${drifts.length} archivo(s)):`,
      );
      for (const d of drifts) {
        console.error(`  - ${d}`);
      }
      console.error('Ejecuta `pnpm agents:sync` para sincronizar.');
      process.exit(1);
    }
    console.log(
      `[agents:check] OK — ${expectedFiles.size} archivos en .agents/ sincronizados con .opencode/.`,
    );
    return;
  }

  console.log(
    `[agents:sync] Sincronizados ${expectedFiles.size} archivos en ${path.relative(REPO_ROOT, AGENTS_DIR) || '.agents'} (${drifts.length} actualizados).`,
  );
}

main();
