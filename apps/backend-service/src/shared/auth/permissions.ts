/**
 * Catálogo de permisos y matriz rol → permisos.
 * Fuente única usada por el seed (tablas permissions / role_permissions)
 * y por el guard requirePermission. Los permisos se resuelven en servidor
 * en cada petición, así que una revocación surte efecto de inmediato.
 *
 * Separación de funciones: quien administra el contenido estructural
 * (dictionary:write) no ratifica contenido cultural (taxonomy:ratify).
 */

export const PERMISSIONS = {
  DICCIONARIO_LEER: 'dictionary:read',
  DICCIONARIO_ESCRIBIR: 'dictionary:write',
  TAXONOMIA_RATIFICAR: 'taxonomy:ratify',
  AUDITORIA_LEER: 'audit:read',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  name: PermissionName;
  resource: string;
  action: string;
  description: string;
}

export const PERMISSION_CATALOG: readonly PermissionDefinition[] = [
  {
    name: PERMISSIONS.DICCIONARIO_LEER,
    resource: 'dictionary',
    action: 'read',
    description: 'Consultar el corpus léxico completo, incluyendo estados editoriales y borradores',
  },
  {
    name: PERMISSIONS.DICCIONARIO_ESCRIBIR,
    resource: 'dictionary',
    action: 'write',
    description: 'Crear, editar y borrar (lógicamente) campos, subcampos, microcampos y palabras',
  },
  {
    name: PERMISSIONS.TAXONOMIA_RATIFICAR,
    resource: 'taxonomy',
    action: 'ratify',
    description: 'Ratificar contenido cultural (ortografía, nombres, glosas)',
  },
  {
    name: PERMISSIONS.AUDITORIA_LEER,
    resource: 'audit',
    action: 'read',
    description: 'Consultar bitácora de auditoría del sistema',
  },
];

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: readonly PermissionName[];
}

export const ROLE_CATALOG: readonly RoleDefinition[] = [
  {
    name: 'super_admin',
    description: 'Administrador raíz: acceso total (uso excepcional)',
    permissions: [
      PERMISSIONS.DICCIONARIO_LEER,
      PERMISSIONS.DICCIONARIO_ESCRIBIR,
      PERMISSIONS.TAXONOMIA_RATIFICAR,
      PERMISSIONS.AUDITORIA_LEER,
    ],
  },
  {
    name: 'admin',
    description: 'Administrador supervisor: supervisa contenido estructural',
    permissions: [PERMISSIONS.DICCIONARIO_LEER, PERMISSIONS.DICCIONARIO_ESCRIBIR],
  },
  {
    name: 'content_admin',
    description: 'Moderador: gestiona el contenido del diccionario',
    permissions: [PERMISSIONS.DICCIONARIO_LEER, PERMISSIONS.DICCIONARIO_ESCRIBIR],
  },
  {
    name: 'cultural_reviewer',
    description: 'Revisor cultural: ratifica contenido (sin edición estructural)',
    permissions: [PERMISSIONS.DICCIONARIO_LEER, PERMISSIONS.TAXONOMIA_RATIFICAR],
  },
  {
    name: 'media_admin',
    description: 'Gestiona archivos multimedia',
    permissions: [],
  },
  {
    name: 'analytics_viewer',
    description: 'Consulta analítica y métricas',
    permissions: [PERMISSIONS.AUDITORIA_LEER],
  },
];
