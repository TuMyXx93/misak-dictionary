import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { router } from './index';

// Mocks para evitar llamadas a red en renderizado
vi.mock('@/services/adminHttp', () => ({
  adminHttp: vi.fn().mockRejectedValue(new Error('unauthorized')),
  adminLogin: vi.fn(),
  adminLogout: vi.fn(),
  adminChangePassword: vi.fn(),
  adminGetMe: vi.fn().mockRejectedValue(new Error('unauthorized')),
}));

vi.mock('@/hooks/useAdmin', () => ({
  useAdminSentidos: vi.fn().mockReturnValue({ data: null, isLoading: false, isError: false }),
  useAdminSentido: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useCreateSentido: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useUpdateSentido: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useDeleteSentido: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useRatificarSentido: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useRevertirSentido: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useRatificarLote: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useProgresoRatificacion: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  usePapelera: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useRestaurarPapelera: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  usePurgarPapelera: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useAdminUsers: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useUpdateUserRoles: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useAdminAudit: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useSystemSettings: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useUpdateSystemSettings: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
}));

describe('Admin Router Integration (T-051, R-001, R-004, R-023)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    cleanup();
  });

  it('el router está configurado con las rutas administrativas protegidas', () => {
    expect(router).toBeDefined();
    expect(router.routes.some((r) => r.path === '/admin')).toBe(true);
    expect(router.routes.some((r) => r.path === '/admin/login')).toBe(true);
  });
});
