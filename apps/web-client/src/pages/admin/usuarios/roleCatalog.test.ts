import { describe, expect, it } from 'vitest';
import { getRoleDisplayName, getRoleVisualDef, ROLE_CATALOG } from './roleCatalog';

describe('roleCatalog (R-006)', () => {
  it('contiene exactamente los 6 roles institucionales definidos en la especificación', () => {
    expect(ROLE_CATALOG).toHaveLength(6);
    const roleIds = ROLE_CATALOG.map((r) => r.id);
    expect(roleIds).toEqual([
      'super_admin',
      'admin',
      'cultural_reviewer',
      'content_admin',
      'media_admin',
      'analytics_viewer',
    ]);
  });

  it('devuelve el nombre legible en español para cada rol conocido', () => {
    expect(getRoleDisplayName('super_admin')).toBe('Superadministrador');
    expect(getRoleDisplayName('admin')).toBe('Administrador');
    expect(getRoleDisplayName('cultural_reviewer')).toBe('Revisor Cultural');
    expect(getRoleDisplayName('content_admin')).toBe('Editor de Contenido');
    expect(getRoleDisplayName('media_admin')).toBe('Gestor de Medios');
    expect(getRoleDisplayName('analytics_viewer')).toBe('Analista');
  });

  it('hace fallback al ID original si el rol no se encuentra en el catálogo', () => {
    expect(getRoleDisplayName('custom_unknown_role')).toBe('custom_unknown_role');
  });

  it('devuelve la definición visual completa para un rol conocido', () => {
    const def = getRoleVisualDef('super_admin');
    expect(def.name).toBe('Superadministrador');
    expect(def.badgeLabel).toBe('Control total');
    expect(def.tone).toBe('accent');
  });

  it('genera definición fallback neutral si el rol no existe', () => {
    const def = getRoleVisualDef('non_existent');
    expect(def.id).toBe('non_existent');
    expect(def.name).toBe('non_existent');
    expect(def.tone).toBe('neutral');
    expect(def.description).toBe('Rol del sistema');
  });
});
