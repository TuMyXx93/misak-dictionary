import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SEMANTIC_FIELDS } from '@/constants/semanticFields';
import { renderWithQueryClient } from '../../../test/renderWithQueryClient';
import { SemanticFieldsLayer } from './SemanticFieldsLayer';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/services/dictionaryApi', async () => {
  const { apiClientMockOk } = await import('../../../test/apiFixtures');
  const actual = await vi.importActual<typeof import('@/services/dictionaryApi')>(
    '@/services/dictionaryApi',
  );
  return {
    ...actual,
    fetchHomeSlots: vi.fn(apiClientMockOk.fetchHomeSlots),
  };
});

describe('SemanticFieldsLayer', () => {
  it('renderiza los 7 botones de campos semánticos', async () => {
    renderWithQueryClient(
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
    renderWithQueryClient(
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

  it('abre el modal al hacer click en un botón coming-soon (sin campo asignado)', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <MemoryRouter>
        <SemanticFieldsLayer />
      </MemoryRouter>,
    );
    const namuiButton = await screen.findByLabelText(
      /^Explorar campo Namui Nu Pirɵ: Nuestro Territorio$/,
    );
    await user.click(namuiButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('cierra el modal al hacer click en el botón de cerrar', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <MemoryRouter>
        <SemanticFieldsLayer />
      </MemoryRouter>,
    );
    const namuiButton = await screen.findByLabelText(
      /^Explorar campo Namui Nu Pirɵ: Nuestro Territorio$/,
    );
    await user.click(namuiButton);
    const closeButton = screen.getByText('Cerrar');
    await user.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('navega al campo cuando tiene slug activo en home_slots', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <MemoryRouter>
        <SemanticFieldsLayer />
      </MemoryRouter>,
    );
    const yaButton = await screen.findByLabelText(/^Explorar campo Ya: La Casa$/);
    await user.click(yaButton);
    expect(mockNavigate).toHaveBeenCalledWith('/campos/ya');
  });
});
