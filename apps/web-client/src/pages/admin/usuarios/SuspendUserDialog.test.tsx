import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminUserItem } from '@/hooks/useAdmin';
import { SuspendUserDialog } from './SuspendUserDialog';

describe('SuspendUserDialog (R-004)', () => {
  const activeUser: AdminUserItem = {
    id: 'usr-1',
    username: 'editor.contenido',
    email: 'editor@namtrik.org',
    fullName: 'Editor de Contenido Misak',
    roles: ['content_admin'],
    isActive: true,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  const suspendedUser: AdminUserItem = {
    ...activeUser,
    id: 'usr-2',
    username: 'usuario.inactivo',
    isActive: false,
  };

  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si user es null', () => {
    const { container } = render(
      <SuspendUserDialog
        user={null}
        isOpen={true}
        isSuspending={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('muestra título de suspensión, advertencia de sesiones y campo de motivo para usuario activo', async () => {
    render(
      <SuspendUserDialog
        user={activeUser}
        isOpen={true}
        isSuspending={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    expect(screen.getByText('Confirmar suspensión de cuenta')).toBeInTheDocument();
    expect(
      screen.getByText(/todas sus sesiones abiertas serán cerradas de inmediato/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/motivo de la suspensión \(opcional\):/i)).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/motivo de la suspensión/i);
    await userEvent.type(reasonInput, 'Salida voluntaria temporal');

    const confirmBtn = screen.getByRole('button', { name: /^suspender cuenta$/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('Salida voluntaria temporal');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra interfaz de reactivación sin campo de motivo para usuario inactivo', async () => {
    render(
      <SuspendUserDialog
        user={suspendedUser}
        isOpen={true}
        isSuspending={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    expect(screen.getByText('Reactivar cuenta de usuario')).toBeInTheDocument();
    expect(
      screen.getByText(/el usuario podrá volver a ingresar normalmente a la plataforma/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/motivo de la suspensión/i)).not.toBeInTheDocument();

    const activateBtn = screen.getByRole('button', { name: /^reactivar cuenta$/i });
    await userEvent.click(activateBtn);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(undefined);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra mensaje de error si onConfirm falla', async () => {
    mockOnConfirm.mockRejectedValueOnce(
      new Error('No es posible suspender al único superadministrador activo.'),
    );

    render(
      <SuspendUserDialog
        user={activeUser}
        isOpen={true}
        isSuspending={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /^suspender cuenta$/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/no es posible suspender al único superadministrador activo/i),
      ).toBeInTheDocument();
    });
  });
});
