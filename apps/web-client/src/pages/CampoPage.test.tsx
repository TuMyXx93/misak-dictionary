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

  it('muestra términos directos del campo cuando existen (Spec 005 C3 Tra tul)', async () => {
    vi.mocked(fetchSemanticFieldBySlug).mockResolvedValueOnce({
      id: '3',
      codigo: 'C3',
      namtrikTermino: 'Tra tul',
      espanolTermino: 'La huerta',
      namtrikDescripcion: 'Descripción de la huerta',
      espanolDescripcion: 'Descripción de la huerta tradicional',
      slug: 'tra-tul',
      sentidos: [
        {
          id: '100',
          codigo: 'C3.SENT.1',
          posicion: 1,
          tipo: 'estandar',
          namtrikTermino: 'Pishik',
          espanolTermino: 'Cebolla',
          espanolGlosa: 'Cebolla',
          formas: [
            {
              orden: 1,
              lema: 'Pishik',
              categoriaGramatical: 'sust.',
              esNeologismo: false,
              rasgosGramaticales: [],
            },
          ],
        },
      ],
      subcampos: [
        {
          id: '30',
          codigo: 'C3.S1',
          namtrikTermino: 'Tusryu kuantrɵmera',
          espanolTermino: 'Cosas de la huerta',
          namtrikDescripcion: null,
          espanolDescripcion: 'Herramientas',
          slug: 'tusryu-kuantro-mera',
          microcampos: [],
        },
      ],
    });

    renderCampoPage('/campos/tra-tul');
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Tra tul' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Términos del campo/i })).toBeInTheDocument();
      expect(screen.getByText('Pishik')).toBeInTheDocument();
      expect(screen.getByText('Cebolla')).toBeInTheDocument();
      expect(screen.getAllByText('Tusryu kuantrɵmera').length).toBeGreaterThan(0);
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
