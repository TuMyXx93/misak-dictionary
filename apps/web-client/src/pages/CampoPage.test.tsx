/**
 * CampoPage Tests
 * Spec 003: página alimentada por API (mock del cliente)
 */

import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { fetchSemanticFieldBySlug } from '@/services/dictionaryApi';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import { CampoPage } from './CampoPage';

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

const renderCampoPage = (initialPath = '/campos/ya') =>
  renderWithQueryClient(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/campos/:fieldSlug" element={<CampoPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CampoPage', () => {
  it('renderiza el campo desde la API', async () => {
    renderCampoPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Ya' })).toBeInTheDocument();
      expect(screen.getByText('La Casa')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Subcampos/i })).toBeInTheDocument();
    });
  });

  it('muestra los subcampos del campo', async () => {
    renderCampoPage();
    await waitFor(() => {
      expect(screen.getAllByText('Namui').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ya Namɵ').length).toBeGreaterThan(0);
    });
  });

  it('muestra error con reintento cuando la API falla', async () => {
    vi.mocked(fetchSemanticFieldBySlug).mockRejectedValueOnce(new Error('API 500'));
    renderCampoPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });

  it('muestra no encontrado para slug inexistente', async () => {
    vi.mocked(fetchSemanticFieldBySlug).mockResolvedValueOnce(null as never);
    renderCampoPage('/campos/no-existe');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Campo no encontrado/i })).toBeInTheDocument();
    });
  });
});
