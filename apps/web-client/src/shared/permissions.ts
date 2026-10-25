/**
 * Catálogo Canónico de Permisos del Frontend
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-002)
 * Alineado exactamente con apps/backend-service/src/shared/auth/permissions.ts
 */

export const PERMISSIONS = {
  // Diccionario & Lexicografía
  DICCIONARIO_LEER: 'dictionary:read',
  DICCIONARIO_ESCRIBIR: 'dictionary:write',
  DICCIONARIO_BORRAR: 'dictionary:delete',

  // Taxonomía & Validación Cultural
  TAXONOMIA_RATIFICAR: 'taxonomy:ratify',
  TAXONOMIA_REVERTIR: 'taxonomy:revert',

  // Multimedia Cultural
  MEDIOS_LEER: 'media:read',
  MEDIOS_ESCRIBIR: 'media:write',
  MEDIOS_BORRAR: 'media:delete',

  // Auditoría & Trazabilidad
  AUDITORIA_LEER: 'audit:read',

  // Gobierno & Configuración del Sistema
  USUARIOS_GESTIONAR: 'users:manage',
  AJUSTES_GESTIONAR: 'settings:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
