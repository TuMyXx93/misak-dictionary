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
  DICCIONARIO_BORRAR: 'dictionary:delete',
  TAXONOMIA_RATIFICAR: 'taxonomy:ratify',
  TAXONOMIA_REVERTIR: 'taxonomy:revert',
  AUDITORIA_LEER: 'audit:read',
  USUARIOS_GESTIONAR: 'users:manage',
  AJUSTES_GESTIONAR: 'settings:manage',
  MEDIOS_LEER: 'media:read',
  MEDIOS_ESCRIBIR: 'media:write',
  MEDIOS_BORRAR: 'media:delete',
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
    description: 'Crear, editar y organizar campos, subcampos, microcampos y palabras',
  },
  {
    name: PERMISSIONS.DICCIONARIO_BORRAR,
    resource: 'dictionary',
    action: 'delete',
    description: 'Mover a papelera y purgar registros léxicos',
  },
  {
    name: PERMISSIONS.TAXONOMIA_RATIFICAR,
    resource: 'taxonomy',
    action: 'ratify',
    description: 'Ratificar contenido cultural (ortografía, nombres, glosas)',
  },
  {
    name: PERMISSIONS.TAXONOMIA_REVERTIR,
    resource: 'taxonomy',
    action: 'revert',
    description: 'Revertir ratificación cultural con registro de motivo',
  },
  {
    name: PERMISSIONS.AUDITORIA_LEER,
    resource: 'audit',
    action: 'read',
    description: 'Consultar bitácora de auditoría y trazabilidad del sistema',
  },
  {
    name: PERMISSIONS.USUARIOS_GESTIONAR,
    resource: 'users',
    action: 'manage',
    description: 'Administración de usuarios, asignación de roles y control de acceso',
  },
  {
    name: PERMISSIONS.AJUSTES_GESTIONAR,
    resource: 'settings',
    action: 'manage',
    description: 'Gestión de configuraciones globales del sistema y modo visual',
  },
  {
    name: PERMISSIONS.MEDIOS_LEER,
    resource: 'media',
    action: 'read',
    description: 'Consultar y reproducir archivos multimedia (incluyendo borradores en panel)',
  },
  {
    name: PERMISSIONS.MEDIOS_ESCRIBIR,
    resource: 'media',
    action: 'write',
    description: 'Subir nuevos archivos multimedia y actualizar sus metadatos culturales',
  },
  {
    name: PERMISSIONS.MEDIOS_BORRAR,
    resource: 'media',
    action: 'delete',
    description: 'Eliminar archivos multimedia del repositorio',
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
    description: 'Control total de la plataforma, configuración técnica y seguridad.',
    permissions: [
      PERMISSIONS.DICCIONARIO_LEER,
      PERMISSIONS.DICCIONARIO_ESCRIBIR,
      PERMISSIONS.DICCIONARIO_BORRAR,
      PERMISSIONS.TAXONOMIA_RATIFICAR,
      PERMISSIONS.TAXONOMIA_REVERTIR,
      PERMISSIONS.AUDITORIA_LEER,
      PERMISSIONS.USUARIOS_GESTIONAR,
      PERMISSIONS.AJUSTES_GESTIONAR,
      PERMISSIONS.MEDIOS_LEER,
      PERMISSIONS.MEDIOS_ESCRIBIR,
      PERMISSIONS.MEDIOS_BORRAR,
    ],
  },
  {
    name: 'admin',
    description: 'Creación de cuentas, asignación de roles y revisión de auditoría.',
    permissions: [
      PERMISSIONS.DICCIONARIO_LEER,
      PERMISSIONS.DICCIONARIO_ESCRIBIR,
      PERMISSIONS.DICCIONARIO_BORRAR,
      PERMISSIONS.AUDITORIA_LEER,
      PERMISSIONS.USUARIOS_GESTIONAR,
      PERMISSIONS.AJUSTES_GESTIONAR,
      PERMISSIONS.MEDIOS_LEER,
    ],
  },
  {
    name: 'cultural_reviewer',
    description: 'Validación, aprobación o reversión de términos y contenidos culturales.',
    permissions: [
      PERMISSIONS.DICCIONARIO_LEER,
      PERMISSIONS.TAXONOMIA_RATIFICAR,
      PERMISSIONS.TAXONOMIA_REVERTIR,
      PERMISSIONS.MEDIOS_LEER,
    ],
  },
  {
    name: 'content_admin',
    description: 'Registro y edición de entradas léxicas, sentidos y medios culturales.',
    permissions: [
      PERMISSIONS.DICCIONARIO_LEER,
      PERMISSIONS.DICCIONARIO_ESCRIBIR,
      PERMISSIONS.MEDIOS_LEER,
      PERMISSIONS.MEDIOS_ESCRIBIR,
    ],
  },
  {
    name: 'media_admin',
    description: 'Gestión de recursos multimedia, audios y videos culturales.',
    permissions: [PERMISSIONS.MEDIOS_LEER, PERMISSIONS.MEDIOS_ESCRIBIR, PERMISSIONS.MEDIOS_BORRAR],
  },
  {
    name: 'analytics_viewer',
    description: 'Consulta de reportes, métricas y registros (acceso de solo lectura).',
    permissions: [
      PERMISSIONS.AUDITORIA_LEER,
      PERMISSIONS.DICCIONARIO_LEER,
      PERMISSIONS.MEDIOS_LEER,
    ],
  },
];
