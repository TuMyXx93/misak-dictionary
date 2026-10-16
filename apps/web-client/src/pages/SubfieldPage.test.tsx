/**
 * SubfieldPage Tests
 * Spec 003: página alimentada por API (mock del cliente)
 */

import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { fetchSemanticFieldBySlug } from '@/services/dictionaryApi';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import { SubfieldPage } from './SubfieldPage';

vi.mock('@/services/dictionaryApi', async () => {
  const { apiClientMockOk } = await import('../test/apiFixtures');
  const actual = await vi.importActual<typeof import('@/services/dictionaryApi')>(
    '@/services/dictionaryApi',
  );
  // Se mockean solo los fetches (como vi.fn para poder sobreescribirlos por test);
  // las funciones puras (toSemanticField) son reales
  return {
    ...actual,
    fetchSemanticFields: vi.fn(apiClientMockOk.fetchSemanticFields),
    fetchSemanticFieldBySlug: vi.fn(apiClientMockOk.fetchSemanticFieldBySlug),
    fetchSearch: vi.fn(apiClientMockOk.fetchSearch),
  };
});

const renderSubfieldPage = (initialPath = '/campos/ya/namui') =>
  renderWithQueryClient(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/campos/:fieldSlug/:subfieldSlug" element={<SubfieldPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('SubfieldPage', () => {
  it('renderiza el subcampo desde la API', async () => {
    renderSubfieldPage();
    await waitFor(() => {
      const headings = screen.getAllByText('Namui').filter((el) => el.tagName === 'H1');
      expect(headings.length).toBe(1);
      expect(screen.getByRole('heading', { name: /Microcampos/i })).toBeInTheDocument();
    });
  });

  it('muestra no encontrado para subcampo inexistente', async () => {
    renderSubfieldPage('/campos/ya/no-existe');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Subcampo no encontrado/i })).toBeInTheDocument();
    });
  });

  it('muestra error con reintento cuando la API falla', async () => {
    vi.mocked(fetchSemanticFieldBySlug).mockRejectedValueOnce(new Error('API 500'));
    renderSubfieldPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
