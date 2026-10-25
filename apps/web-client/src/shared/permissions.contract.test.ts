import { describe, expect, it } from 'vitest';
import { PERMISSIONS as BACKEND_PERMISSIONS } from '../../../backend-service/src/shared/auth/permissions.js';
import { PERMISSIONS as FRONTEND_PERMISSIONS } from './permissions.js';

describe('Permissions Contract Test (R-002)', () => {
  it('garantiza que el catálogo de permisos en frontend coincide con el del backend', () => {
    expect(FRONTEND_PERMISSIONS).toEqual(BACKEND_PERMISSIONS);
  });
});
