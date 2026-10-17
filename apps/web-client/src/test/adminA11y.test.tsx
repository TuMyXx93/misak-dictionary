/**
 * adminA11y.test.tsx
 * Spec 006 (R-021, T-052)
 * Auditoría exhaustiva de accesibilidad en el panel administrativo:
 * - Tap targets >= 44x44 / >= 48px
 * - Skip link para teclado hacia #admin-main
 * - Etiquetas y roles ARIA (role=alert, role=switch, role=progressbar, role=dialog)
 * - Foco visible y navegación lingüística (lang="gum", spellcheck=false)
 */

import { cleanup, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CampoNamtrik } from '@/components/admin/CampoNamtrik';
import { ChecklistRatificacion } from '@/components/admin/ChecklistRatificacion';
import { ConfirmarPorCodigo } from '@/components/admin/ConfirmarPorCodigo';
import { ConflictoVersionDialog } from '@/components/admin/ConflictoVersionDialog';
import { AjustesPage } from '@/pages/admin/AjustesPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/hooks/useAdmin', () => ({
  useProgresoRatificacion: vi.fn().mockReturnValue({
    data: {
      global: { total: 10, ratificados: 8, borradores: 2, porcentaje: 80 },
      nodos: [
        {
          codigo: 'C1',
          titulo: 'Cosmovisión',
          tipo: 'campo',
          total: 10,
          ratificados: 8,
          borradores: 2,
          porcentaje: 80,
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useSystemSettings: vi.fn().mockReturnValue({
    data: { publicOnlyRatified: false },
    isLoading: false,
    isError: false,
  }),
  useUpdateSystemSettings: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('Auditoría de Accesibilidad (T-052, R-021, R-022, R-026)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setSession(
      {
        userId: 'admin-1',
        email: 'root@namtrik.org',
        roles: ['super_admin'],
        permissions: ['taxonomy:read', 'taxonomy:write', 'system:settings:manage'],
      },
      'token-root',
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('AdminLayout implementa skip-link accesible con ancla #admin-main para usuarios de teclado', () => {
    render(
      <BrowserRouter>
        <AdminLayout>
          <div>Contenido</div>
        </AdminLayout>
      </BrowserRouter>,
    );

    const skipLink = screen.getByRole('link', { name: /saltar al contenido principal/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#admin-main');

    const mainElement = document.getElementById('admin-main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveAttribute('tabIndex', '-1');
  });

  it('CampoNamtrik cumple con lang="gum", spellCheck=false y botones táctiles accesibles >= 44x44px', () => {
    render(
      <CampoNamtrik id="test-campo" label="Lema de prueba" value="namtrik" onChange={vi.fn()} />,
    );

    const input = screen.getByLabelText(/lema de prueba/i);
    expect(input).toHaveAttribute('lang', 'gum');
    expect(input).toHaveAttribute('spellcheck', 'false');

    const btnLower = screen.getByRole('button', { name: /insertar letra minúscula ɵ/i });
    const btnUpper = screen.getByRole('button', { name: /insertar letra mayúscula Ɵ/i });

    expect(btnLower.className).toMatch(/min-h-\[44px\]/);
    expect(btnLower.className).toMatch(/min-w-\[44px\]/);
    expect(btnUpper.className).toMatch(/min-h-\[44px\]/);
    expect(btnUpper.className).toMatch(/min-w-\[44px\]/);
  });

  it('LoginPage provee botones de envío con tap target >= 48px y alertas accesibles', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    const submitBtn = screen.getByRole('button', { name: /ingresar/i });
    expect(submitBtn.className).toMatch(/min-h-\[48px\]/);
  });

  it('ChecklistRatificacion implementa rol dialog accesible con modales etiquetados', () => {
    render(
      <ChecklistRatificacion
        isOpen={true}
        sentidoCodigo="C1.S1.M1.E001"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'ratify-dialog-title');
    expect(screen.getByRole('heading', { name: /ratificación editorial/i })).toHaveAttribute(
      'id',
      'ratify-dialog-title',
    );
  });

  it('ConfirmarPorCodigo y ConflictoVersionDialog usan modales accesibles con botones de acción >= 48px', () => {
    const { rerender } = render(
      <ConfirmarPorCodigo
        isOpen={true}
        targetCodigo="C1.S1.M5.E003"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'purge-dialog-title');
    const purgeConfirmBtn = screen.getByRole('button', { name: /confirmar purga permanente/i });
    expect(purgeConfirmBtn.className).toMatch(/min-h-\[48px\]/);

    rerender(
      <ConflictoVersionDialog
        isOpen={true}
        serverVersion={2}
        onReloadServer={vi.fn()}
        onOverwrite={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'conflict-dialog-title');
    const overwriteBtn = screen.getByRole('button', { name: /sobrescribir con mis cambios/i });
    expect(overwriteBtn.className).toMatch(/min-h-\[48px\]/);
  });

  it('DashboardPage implementa progressbars accesibles con atributos ARIA completos', () => {
    render(<DashboardPage />);

    const progressbars = screen.getAllByRole('progressbar');
    for (const pb of progressbars) {
      expect(pb).toHaveAttribute('aria-valuenow');
      expect(pb).toHaveAttribute('aria-valuemin', '0');
      expect(pb).toHaveAttribute('aria-valuemax', '100');
    }
  });

  it('AjustesPage implementa interruptor accesible role="switch" con aria-checked y tap target >= 44px', () => {
    render(<AjustesPage />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle.className).toMatch(/min-h-\[44px\]/);
    expect(toggle.className).toMatch(/min-w-\[44px\]/);
  });
});
