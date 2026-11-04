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

  it('muestra la terminología pública actualizada del buscador', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();

    expect(screen.getByText('Buscador bilingüe Namtrik · Castellano')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digita un término')).toBeInTheDocument();
  });

  it('no muestra menú de resultados cuando el texto tiene menos de 2 caracteres', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByPlaceholderText('Digita un término');
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
    const input = screen.getByPlaceholderText('Digita un término');
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
    const input = screen.getByPlaceholderText('Digita un término');
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
    const input = screen.getByPlaceholderText('Digita un término');
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
    const input = screen.getByPlaceholderText('Digita un término');
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

  it('soporta atributos accesibles combobox, navegación por teclado y botón de limpieza', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            namtrikTermino: 'Mɵpik',
            espanolTermino: 'Vaca',
            categoriaGramatical: 'sustantivo',
            ubicacion: {
              campoSlug: 'kau-ushamera',
              campoNombre: 'Animales',
              subcampoSlug: 'mamiferos',
              subcampoNombre: 'Mamíferos',
              ruta: '/campos/kau-ushamera/mamiferos#term-1',
            },
          },
          {
            id: '2',
            namtrikTermino: 'Ya',
            espanolTermino: 'Casa',
            ubicacion: {
              campoSlug: 'ya',
              campoNombre: 'La Casa',
              ruta: '/campos/ya#term-2',
            },
          },
        ],
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');

    // Escribir texto activa el desplegable
    fireEvent.change(input, { target: { value: 'mɵ' } });
    expect(input).toHaveAttribute('aria-expanded', 'true');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);

    // Navegación por flecha abajo
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', 'search-item-0');

    // Input type="text" con inputMode="search" para evitar la doble X nativa del navegador
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'search');

    // Botón de limpiar búsqueda
    const clearButton = screen.getByRole('button', { name: /Limpiar búsqueda/i });
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(input).toHaveValue('');
  });

  it('permite insertar grafema Namtrik ɵ y confirma la supresión de ɨ', () => {
    renderComponent();
    const input = screen.getByRole('combobox');

    const btnTheta = screen.getByRole('button', { name: 'ɵ' });
    expect(btnTheta.className).toContain('font-display');
    expect(btnTheta.className).not.toContain('font-mono');

    fireEvent.click(btnTheta);
    expect(input).toHaveValue('ɵ');

    // Confirmación explícita de supresión de grafema 'ɨ'
    expect(screen.queryByRole('button', { name: 'ɨ' })).not.toBeInTheDocument();
  });

  it('cuenta con botón de lupa interactivo que dispara la búsqueda inmediata', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: {
        data: [
          {
            id: '1',
            namtrikTermino: 'Waara',
            espanolTermino: 'Vaca',
            coincidencia: 'exacta',
          },
        ],
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'waara' } });

    const submitBtn = screen.getByRole('button', { name: /Buscar inmediatamente/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveAttribute('type', 'submit');

    fireEvent.click(submitBtn);

    // Muestra badge de coincidencia exacta
    expect(screen.getByText(/Exacta/i)).toBeInTheDocument();
  });

  it('renderiza badge de coincidencia tipo prefijo', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: {
        data: [
          {
            id: '2',
            namtrikTermino: 'Mɵrɵpik',
            espanolTermino: 'Médico',
            coincidencia: 'prefijo',
          },
        ],
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'mɵr' } });

    expect(screen.getByText(/Prefijo/i)).toBeInTheDocument();
  });
});
