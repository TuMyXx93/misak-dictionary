import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SemanticFieldsLayer } from './SemanticFieldsLayer';

describe('SemanticFieldsLayer', () => {
  it('renderiza los 5 botones de campos semánticos', async () => {
    render(<SemanticFieldsLayer />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });
  });

  it('abre el modal al hacer click en un botón', async () => {
    const user = userEvent.setup();
    render(<SemanticFieldsLayer />);
    const yaButton = await screen.findByLabelText(/^Explorar campo semántico: Ya$/i);
    await user.click(yaButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('cierra el modal al hacer click en el botón de cerrar', async () => {
    const user = userEvent.setup();
    render(<SemanticFieldsLayer />);
    const yaButton = await screen.findByLabelText(/^Explorar campo semántico: Ya$/i);
    await user.click(yaButton);
    const closeButton = screen.getByText('Cerrar');
    await user.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
