/**
 * CamposIndex Tests
 * Spec 003: índice alimentado por API (mock del cliente)
 */

import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { fetchSemanticFields } from '@/services/dictionaryApi';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import { CamposIndex } from './CamposIndex';

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

const renderCamposIndex = () =>
  renderWithQueryClient(
    <MemoryRouter initialEntries={['/campos']}>
      <Routes>
        <Route path="/campos" element={<CamposIndex />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CamposIndex', () => {
  it('renderiza el título principal', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Campos Semánticos' }),
      ).toBeInTheDocument();
    });
  });

  it('renderiza la descripción', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(
        screen.getByText(/Explora los campos semánticos del diccionario Misak/i),
      ).toBeInTheDocument();
    });
  });

  it('no renderiza la insignia editorial superior', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(
        screen.queryByText('Sabiduría del Territorio · Wamtɵrmarɵpik'),
      ).not.toBeInTheDocument();
    });
  });

  it('renderiza los campos desde la API', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(screen.getByText('Ya')).toBeInTheDocument();
      expect(screen.getByText('La Casa')).toBeInTheDocument();
      expect(screen.getByText('Kaumpu Ushamera')).toBeInTheDocument();
    });
  });

  it('marca como Próximamente los campos sin jerarquía', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(screen.getAllByText('Próximamente').length).toBe(2);
    });
  });

  it('muestra estado de error con reintento cuando la API falla', async () => {
    vi.mocked(fetchSemanticFields).mockRejectedValueOnce(new Error('API 500'));
    renderCamposIndex();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });
});

// Referencia para evitar lint de import no usado
