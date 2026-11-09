/**
 * ConfirmarPorCodigo.test.tsx
 * Tests unitarios para el diálogo de confirmación estricta por código (R-017, T-047).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmarPorCodigo } from './ConfirmarPorCodigo';

describe('ConfirmarPorCodigo', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    render(
      <ConfirmarPorCodigo
        isOpen={false}
        targetCodigo="S-001"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza con botón de confirmación deshabilitado hasta tipear el código exacto', async () => {
    render(
      <ConfirmarPorCodigo
        isOpen={true}
        targetCodigo="S-001"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /confirmar purga permanente/i });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'S-002');
    expect(confirmBtn).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, 'S-001');
    expect(confirmBtn).not.toBeDisabled();

    await userEvent.click(confirmBtn);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('muestra estado de carga cuando isLoading es true', () => {
    render(
      <ConfirmarPorCodigo
        isOpen={true}
        targetCodigo="S-001"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isLoading={true}
      />,
    );

    expect(screen.getByText('Purgando...')).toBeInTheDocument();
  });

  it('llama a onCancel al presionar Cancelar', async () => {
    render(
      <ConfirmarPorCodigo
        isOpen={true}
        targetCodigo="S-001"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelBtn);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
