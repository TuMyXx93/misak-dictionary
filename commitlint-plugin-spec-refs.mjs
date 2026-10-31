/**
 * Plugin commitlint local: spec-refs (Constitución C4.2 — trazabilidad).
 * Exige footer "Refs: specs/features/NNN-slug" (o specs/adr/NNNN-slug, o "Refs: none")
 * en todo commit de tipo feat o fix.
 * Referenciado desde commitlint.config.js vía plugins.
 */

const specRefsRule = (parsed) => {
  const needsRefs = ['feat', 'fix'].includes(parsed.type);
  if (!needsRefs) return [true];
  const text = `${parsed.body ?? ''}\n${parsed.footer ?? ''}`;
  const ok =
    /Refs:\s*(specs\/(?:features|archive)\/\d{3}-[a-z0-9-]+|specs\/adr\/\d{4}-[a-z0-9-]+|none)\b/.test(
      text,
    );
  return [
    ok,
    'los commits feat/fix deben incluir "Refs: specs/features/NNN-slug" (o specs/archive/NNN-slug, o specs/adr/NNNN-slug, o "Refs: none")',
  ];
};

export default {
  rules: {
    'spec-refs': specRefsRule,
  },
};
