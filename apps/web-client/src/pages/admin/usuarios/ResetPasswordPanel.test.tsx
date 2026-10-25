import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminUserItem } from '@/hooks/useAdmin';
import { ResetPasswordPanel } from './ResetPasswordPanel';

describe('ResetPasswordPanel (R-005)', () => {
  const mockUser: AdminUserItem = {
    id: 'usr-10',
    username: 'gestor.medios',
    email: 'medios@namtrik.org',
    fullName: 'Gestor de Medios Misak',
    roles: ['media_admin'],
    isActive: true,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  const mockOnClose = vi.fn();
  const mockOnResetPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si user es null', () => {
    const { container } = render(
      <ResetPasswordPanel
        user={null}
        isOpen={true}
        onClose={mockOnClose}
        onResetPassword={mockOnResetPassword}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('muestra advertencia de procedimiento de seguridad y botón para generar clave temporal', async () => {
    mockOnResetPassword.mockResolvedValueOnce({ temporaryPassword: 'TempKey#2026' });

    render(
      <ResetPasswordPanel
        user={mockUser}
        isOpen={true}
        onClose={mockOnClose}
        onResetPassword={mockOnResetPassword}
      />,
    );

    expect(screen.getByText('Restablecer contraseña de acceso')).toBeInTheDocument();
    expect(
      screen.getByText(
        /el integrante deberá cambiarla obligatoriamente en su próximo inicio de sesión/i,
      ),
    ).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: /generar clave temporal/i });
    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(mockOnResetPassword).toHaveBeenCalledWith('usr-10');
      expect(screen.getByText('TempKey#2026')).toBeInTheDocument();
      expect(
        screen.getByText(/copia y entrega esta clave segura al integrante/i),
      ).toBeInTheDocument();
    });
  });

  it('permite copiar la clave temporal generada', async () => {
    mockOnResetPassword.mockResolvedValueOnce({ temporaryPassword: 'TempKey#2026' });
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(
      <ResetPasswordPanel
        user={mockUser}
        isOpen={true}
        onClose={mockOnClose}
        onResetPassword={mockOnResetPassword}
      />,
    );

    const generateBtn = screen.getByRole('button', { name: /generar clave temporal/i });
    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('TempKey#2026')).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: /copiar/i });
    await userEvent.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith('TempKey#2026');
    expect(screen.getByText('✓ Copiada')).toBeInTheDocument();
  });

  it('muestra mensaje de error si onResetPassword falla', async () => {
    mockOnResetPassword.mockRejectedValueOnce(new Error('Fallo del servidor de autenticación'));

    render(
      <ResetPasswordPanel
        user={mockUser}
        isOpen={true}
        onClose={mockOnClose}
        onResetPassword={mockOnResetPassword}
      />,
    );

    const generateBtn = screen.getByRole('button', { name: /generar clave temporal/i });
    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/fallo del servidor de autenticación/i)).toBeInTheDocument();
    });
  });

  it('permite cerrar el diálogo con el botón cancelar y con el botón cerrar tras generación', async () => {
    const { rerender } = render(
      <ResetPasswordPanel
        user={mockUser}
        isOpen={true}
        onClose={mockOnClose}
        onResetPassword={mockOnResetPassword}
      />,
    );

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    mockOnResetPassword.mockResolvedValueOnce({ temporaryPassword: 'TempKey#999' });

    rerender(
      <ResetPasswordPanel
        user={mockUser}
        isOpen={true}
        onClose={mockOnClose}
        onResetPassword={mockOnResetPassword}
      />,
    );

    const generateBtn = screen.getByRole('button', { name: /generar clave temporal/i });
    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('TempKey#999')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /entendido y cerrar/i });
    await userEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
