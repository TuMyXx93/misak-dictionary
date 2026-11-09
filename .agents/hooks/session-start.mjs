#!/usr/bin/env node
/**
 * Hook SessionStart (engram-protocol): inyecta el recordatorio del protocolo
 * Engram + Pre-Task Security Gate (/version-gate) al iniciar una sesión.
 */

process.stdout.write(
  JSON.stringify({
    injectSteps: [
      {
        systemMessage: {
          systemMessage:
            '[Misak Dictionary — Protocolo Activo] (1) Al iniciar sesión, carga contexto con mem_context(project: "misak-dictionary") de Engram. (2) Antes de modificar código, ejecuta /version-gate. (3) Para SDD usa /sdd-specify, /sdd-plan y /sdd-tasks. (4) Al finalizar trabajo significativo, registra mem_save y mem_session_summary.',
        },
      },
    ],
  }),
);
