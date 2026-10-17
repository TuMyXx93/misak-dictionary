import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { AuditoriaPage } from './AuditoriaPage';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminAudit: vi.fn(),
}));

describe('AuditoriaPage (T-049, R-019)', () => {
  const mockAuditData = {
    items: [
      {
        id: 'aud-1',
        action: 'sentido:update',
        userId: 'usr-editor-1',
        entityType: 'sentido',
        entityId: 's-12345678-abcd',
        createdAt: '2026-10-16T14:30:00Z',
        oldData: { lema: 'mɵi', glosa: 'persona' },
        newData: { lema: 'mɵi', glosa: 'persona / ser humano' },
      },
    ],
    nextCursor: 'cur-next',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdminModule.useAdminAudit).mockReturnValue({
      data: mockAuditData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza la tabla de auditoría con acción, usuario y entidad', () => {
    render(<AuditoriaPage />);

    expect(
      screen.getByRole('heading', { name: /registro de auditoría del sistema/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('sentido:update')).toBeInTheDocument();
    expect(screen.getByText('usr-editor-1')).toBeInTheDocument();
    expect(screen.getByText(/s-123456/i)).toBeInTheDocument();
  });

  it('permite filtrar por acción disparando la consulta correspondiente', async () => {
    render(<AuditoriaPage />);

    const actionSelect = screen.getByLabelText(/filtrar por acción/i);
    await userEvent.selectOptions(actionSelect, 'sentido:ratify');

    expect(useAdminModule.useAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'sentido:ratify',
      }),
    );
  });

  it('abre diálogo modal para inspeccionar cambios oldData y newData', async () => {
    render(<AuditoriaPage />);

    const detailsBtn = screen.getByRole('button', { name: /ver cambios/i });
    await userEvent.click(detailsBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/detalle de auditoría: sentido:update/i)).toBeInTheDocument();
    expect(screen.getByText(/persona \/ ser humano/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /cerrar/i });
    await userEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
