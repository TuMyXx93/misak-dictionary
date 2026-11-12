import { describe, expect, it } from 'vitest';
import { PERMISSIONS as BACKEND_PERMISSIONS } from '../../../backend-service/src/shared/auth/permissions.js';
import { ADMIN_ROUTE_POLICIES } from './adminRoutes.js';
import { PERMISSIONS as FRONTEND_PERMISSIONS } from './permissions.js';

describe('Permissions Contract Test (R-002, Spec 013 R-006)', () => {
  it('garantiza que el catálogo de permisos en frontend coincide con el del backend', () => {
    expect(FRONTEND_PERMISSIONS).toEqual(BACKEND_PERMISSIONS);
  });

  it('garantiza que todas las políticas de rutas administrativas usan permisos canónicos válidos', () => {
    const validPermissions = new Set<string>(Object.values(FRONTEND_PERMISSIONS));

    for (const policy of ADMIN_ROUTE_POLICIES) {
      expect(validPermissions.has(policy.permission)).toBe(true);
      for (const perm of policy.anyOfPermissions ?? []) {
        expect(validPermissions.has(perm)).toBe(true);
      }
    }
  });
});
