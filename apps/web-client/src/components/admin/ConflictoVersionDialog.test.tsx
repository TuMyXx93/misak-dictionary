/**
 * ConflictoVersionDialog.test.tsx
 * Tests unitarios para el diálogo de resolución de conflicto de versión concurrente 409 (R-007, R-010).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictoVersionDialog } from './ConflictoVersionDialog';

describe('ConflictoVersionDialog', () => {
  const mockOnReloadServer = vi.fn();
  const mockOnOverwrite = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    render(
      <ConflictoVersionDialog
        isOpen={false}
        serverVersion={2}
        onReloadServer={mockOnReloadServer}
        onOverwrite={mockOnOverwrite}
        onCancel={mockOnCancel}
      />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza título con versión del servidor y datos modificados', () => {
    render(
      <ConflictoVersionDialog
        isOpen={true}
        serverVersion={3}
        serverData={{ lema: 'shɵka nuevo', glosa: 'definición actualizada' }}
        onReloadServer={mockOnReloadServer}
        onOverwrite={mockOnOverwrite}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText(/versión 3/i)).toBeInTheDocument();
    expect(screen.getByText('shɵka nuevo')).toBeInTheDocument();
    expect(screen.getByText('definición actualizada')).toBeInTheDocument();
  });

  it('usa texto de fallback cuando serverVersion no está definido', () => {
    render(
      <ConflictoVersionDialog
        isOpen={true}
        onReloadServer={mockOnReloadServer}
        onOverwrite={mockOnOverwrite}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText(/versión actualizada/i)).toBeInTheDocument();
  });

  it('permite recargar datos del servidor, sobrescribir o cancelar', async () => {
    render(
      <ConflictoVersionDialog
        isOpen={true}
        serverVersion={2}
        onReloadServer={mockOnReloadServer}
        onOverwrite={mockOnOverwrite}
        onCancel={mockOnCancel}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /cargar datos del servidor/i }));
    expect(mockOnReloadServer).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /sobrescribir con mis cambios/i }));
    expect(mockOnOverwrite).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /cancelar y revisar/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
