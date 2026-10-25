/**
 * roleCatalog.ts
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-006)
 * Catálogo visual de 6 roles en español, sin tecnicismos en inglés ni guiones bajos.
 */

export interface RoleVisualDef {
  id: string;
  name: string;
  description: string;
  badgeLabel: string;
  tone: 'accent' | 'primary' | 'success' | 'neutral';
}

export const ROLE_CATALOG: readonly RoleVisualDef[] = [
  {
    id: 'super_admin',
    name: 'Superadministrador',
    description: 'Control total de la plataforma, configuración técnica y seguridad.',
    badgeLabel: 'Control total',
    tone: 'accent',
  },
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Creación de cuentas, asignación de roles y revisión de auditoría.',
    badgeLabel: 'Gestión',
    tone: 'primary',
  },
  {
    id: 'cultural_reviewer',
    name: 'Revisor Cultural',
    description: 'Validación, aprobación o reversión de términos y contenidos culturales.',
    badgeLabel: 'Validación',
    tone: 'success',
  },
  {
    id: 'content_admin',
    name: 'Editor de Contenido',
    description: 'Registro y edición de entradas léxicas, sentidos y medios culturales.',
    badgeLabel: 'Editorial',
    tone: 'primary',
  },
  {
    id: 'media_admin',
    name: 'Gestor de Medios',
    description: 'Gestión de recursos multimedia, audios y videos culturales.',
    badgeLabel: 'Medios',
    tone: 'primary',
  },
  {
    id: 'analytics_viewer',
    name: 'Analista',
    description: 'Consulta de reportes, métricas y registros (acceso de solo lectura).',
    badgeLabel: 'Solo lectura',
    tone: 'neutral',
  },
] as const;

export function getRoleDisplayName(roleId: string): string {
  const found = ROLE_CATALOG.find((r) => r.id === roleId);
  return found?.name ?? roleId;
}

export function getRoleVisualDef(roleId: string): RoleVisualDef {
  const found = ROLE_CATALOG.find((r) => r.id === roleId);
  if (found) return found;

  return {
    id: roleId,
    name: roleId,
    description: 'Rol del sistema',
    badgeLabel: roleId,
    tone: 'neutral',
  };
}
