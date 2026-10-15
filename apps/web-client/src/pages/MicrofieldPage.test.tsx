/**
 * MicrofieldPage Tests
 * Spec 003: página alimentada por API (mock del cliente)
 */

import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { fetchSemanticFieldBySlug } from '@/services/dictionaryApi';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import { MicrofieldPage } from './MicrofieldPage';

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

const renderMicrofieldPage = (initialPath = '/campos/ya/namui/kawe') =>
  renderWithQueryClient(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/campos/:fieldSlug/:subfieldSlug/:microfieldSlug"
          element={<MicrofieldPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('MicrofieldPage', () => {
  it('renderiza los términos del microcampo desde la API', async () => {
    renderMicrofieldPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Términos \(2\)/i })).toBeInTheDocument();
      expect(screen.getByText(/Sruik/)).toBeInTheDocument();
      expect(screen.getByText(/Olla de barro/)).toBeInTheDocument();
    });
  });

  it('muestra no encontrado para microcampo inexistente', async () => {
    renderMicrofieldPage('/campos/ya/namui/no-existe');
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Microcampo no encontrado/i }),
      ).toBeInTheDocument();
    });
  });

  it('muestra error con reintento cuando la API falla', async () => {
    vi.mocked(fetchSemanticFieldBySlug).mockRejectedValueOnce(new Error('API 500'));
    renderMicrofieldPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
