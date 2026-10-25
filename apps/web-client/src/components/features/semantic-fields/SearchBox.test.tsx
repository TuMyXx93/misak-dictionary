/**
 * SearchBox.test.tsx
 * Pruebas unitarias para el componente de búsqueda bilingüe SearchBox
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as dictionaryHooks from '@/hooks/useDictionary';
import { SearchBox } from './SearchBox';

vi.mock('@/hooks/useDictionary', () => ({
  useSearchTerms: vi.fn(),
}));

// Mock useDebounce to return the input immediately for tests
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (val: string) => val,
}));

describe('SearchBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <SearchBox />
      </BrowserRouter>,
    );

  it('no muestra menú de resultados cuando el texto tiene menos de 2 caracteres', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByPlaceholderText(/Buscar términos/i);
    fireEvent.change(input, { target: { value: 'a' } });

    expect(screen.queryByText(/Sin resultados/i)).not.toBeInTheDocument();
  });

  it('muestra estado de carga mientras busca términos', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByPlaceholderText(/Buscar términos/i);
    fireEvent.change(input, { target: { value: 'piurek' } });

    expect(screen.getByText('Buscando…')).toBeInTheDocument();
    expect(screen.getByText('buscando…')).toBeInTheDocument();
  });

  it('muestra estado de error cuando la búsqueda falla', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByPlaceholderText(/Buscar términos/i);
    fireEvent.change(input, { target: { value: 'error' } });

    expect(screen.getByText('Error en la búsqueda.')).toBeInTheDocument();
  });

  it('muestra mensaje de sin resultados cuando la consulta no arroja coincidencias', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: { data: [], total: 0 } as unknown as ReturnType<
        typeof dictionaryHooks.useSearchTerms
      >['data'],
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByPlaceholderText(/Buscar términos/i);
    fireEvent.change(input, { target: { value: 'palabra_inexistente' } });

    expect(screen.getByText(/Sin resultados para “palabra_inexistente”/i)).toBeInTheDocument();
  });

  it('renderiza enlaces con jerarquía taxonómica completa (campo/subcampo/microcampo)', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            namtrikTermino: 'Mɵrɵpik',
            espanolTermino: 'Médico tradicional',
            microcampos: [
              {
                microcampo: {
                  slug: 'shamanismo',
                  subcampoSemantico: {
                    slug: 'salud',
                    campoSemantico: {
                      slug: 'medicina-ancestral',
                    },
                  },
                },
              },
            ],
          },
          {
            id: '2',
            namtrikTermino: 'Pik',
            espanolTermino: 'Curandero',
            microcampos: [
              {
                microcampo: {
                  subcampoSemantico: {
                    slug: 'salud-general',
                    campoSemantico: {
                      slug: 'medicina',
                    },
                  },
                },
              },
            ],
          },
          {
            id: '3',
            namtrikTermino: 'Yal',
            espanolTermino: 'Planta medicinal',
            microcampos: [
              {
                microcampo: {
                  subcampoSemantico: {
                    campoSemantico: {
                      slug: 'botanica',
                    },
                  },
                },
              },
            ],
          },
          {
            id: '4',
            namtrikTermino: 'Wam',
            espanolTermino: 'Palabra',
            microcampos: [],
          },
        ],
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByPlaceholderText(/Buscar términos/i);
    fireEvent.change(input, { target: { value: 'ter' } });

    const linkFull = screen.getByText('Mɵrɵpik').closest('a');
    expect(linkFull).toHaveAttribute('href', '/campos/medicina-ancestral/salud/shamanismo');

    const linkSub = screen.getByText('Pik').closest('a');
    expect(linkSub).toHaveAttribute('href', '/campos/medicina/salud-general');

    const linkCampo = screen.getByText('Yal').closest('a');
    expect(linkCampo).toHaveAttribute('href', '/campos/botanica');

    const linkFallback = screen.getByText('Wam').closest('a');
    expect(linkFallback).toHaveAttribute('href', '/campos');
  });
});
