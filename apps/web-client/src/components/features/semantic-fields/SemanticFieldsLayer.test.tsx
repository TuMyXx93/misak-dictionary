import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SEMANTIC_FIELDS } from '@/constants/semanticFields';
import { SemanticFieldsLayer } from './SemanticFieldsLayer';

describe('SemanticFieldsLayer', () => {
  it('renderiza los 7 botones de campos semánticos', async () => {
    render(
      <MemoryRouter>
        <SemanticFieldsLayer />
      </MemoryRouter>,
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(7);
    });
  });

  it('el orden DOM coincide con el orden normativo de SEMANTIC_FIELDS', async () => {
    render(
      <MemoryRouter>
        <SemanticFieldsLayer />
      </MemoryRouter>,
    );
    const buttons = await screen.findAllByRole('button');
    const labels = buttons.map((btn) => btn.getAttribute('aria-label'));
    expect(labels[0]).toBe(
      `Explorar campo ${SEMANTIC_FIELDS[0].name}: ${SEMANTIC_FIELDS[0].nameSpanish}`,
    );
    expect(labels[6]).toBe(
      `Explorar campo ${SEMANTIC_FIELDS[6].name}: ${SEMANTIC_FIELDS[6].nameSpanish}`,
    );
  });

  it('abre el modal al hacer click en un botón coming-soon', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SemanticFieldsLayer />
      </MemoryRouter>,
    );
    const yaTulButton = await screen.findByLabelText(/^Explorar campo Ya Tul: La Huerta$/);
    await user.click(yaTulButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('cierra el modal al hacer click en el botón de cerrar', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SemanticFieldsLayer />
      </MemoryRouter>,
    );
    const yaTulButton = await screen.findByLabelText(/^Explorar campo Ya Tul: La Huerta$/);
    await user.click(yaTulButton);
    const closeButton = screen.getByText('Cerrar');
    await user.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
