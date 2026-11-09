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

  it('no muestra menú de resultados cuando la consulta está vacía o solo contiene espacios', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByPlaceholderText('Digita un término');
    fireEvent.change(input, { target: { value: '   ' } });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('habilita búsqueda desde 1 carácter para monografemas Namtrik como "ú" o "u" (Enmienda 0.4.0)', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: {
        data: [
          {
            id: '961',
            codigo: 'C6.S5.E028',
            namtrikTermino: 'Ú',
            espanolTermino: 'Flor',
            coincidencia: 'exacta',
            campoCoincidencia: 'lema',
          },
        ],
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'ú' } });

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Ú')).toBeInTheDocument();
    expect(screen.getByText('— Flor')).toBeInTheDocument();
    expect(screen.getByText('Exacta')).toBeInTheDocument();
  });

  it('muestra badge "En descripción" y extracto contextual cuando la coincidencia ocurre en explicación (Enmienda 0.4.0)', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: {
        data: [
          {
            id: '90',
            codigo: 'C1.S3.E013',
            namtrikTermino: 'Kɵnchapik',
            espanolTermino: 'Representación de la estrella',
            coincidencia: 'aproximada',
            campoCoincidencia: 'explicacion',
            extractoCoincidencia:
              '…representa los cuatro puntos cardinales del mundo y el cosmos Misak…',
          },
        ],
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'mundo' } });

    expect(screen.getByText('Kɵnchapik')).toBeInTheDocument();
    expect(screen.getByText('En descripción')).toBeInTheDocument();
    expect(
      screen.getByText(/representa los cuatro puntos cardinales del mundo/i),
    ).toBeInTheDocument();
  });

  it('muestra insignia "Equivalencia" cuando campoCoincidencia es "equivalencia" (Spec 012)', () => {
    vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
      data: {
        data: [
          {
            id: '745',
            codigo: 'C1.S3.E013',
            namtrikTermino: 'Kɵnchapik',
            espanolTermino: 'Representación de la estrella',
            coincidencia: 'aproximada',
            campoCoincidencia: 'equivalencia',
            terminoEquivalente: 'estrella',
          },
        ],
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
      isLoading: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'estrella' } });

    expect(screen.getByText('Kɵnchapik')).toBeInTheDocument();
    expect(screen.getByText(/Equivalencia: estrella/i)).toBeInTheDocument();
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

    // Navegación por flecha abajo con IDs acotados por instancia (useId)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]?.id).toBeTruthy();
    expect(input).toHaveAttribute('aria-activedescendant', options[0]?.id);

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

  describe('Spec 012 v0.3.0 — Auto-Scroll de Listbox, Suite Keyboard Geek, IME y HTML5 válido', () => {
    const buildLongResults = (count: number) =>
      Array.from({ length: count }, (_, idx) => ({
        id: String(idx + 1),
        namtrikTermino: `Lema ${idx + 1}`,
        espanolTermino: `Glosa ${idx + 1}`,
        categoriaGramatical: 's.',
        ubicacion: {
          campoSlug: 'ya',
          campoNombre: 'Ya',
          subcampoSlug: 'nakchak',
          subcampoNombre: 'Nakchak',
          microcampoSlug: 'wammera',
          microcampoNombre: 'Wammera',
          ruta: `/campos/ya/nakchak/wammera#term-${idx + 1}`,
        },
      }));

    it('desplaza automáticamente container.scrollTop al navegar hacia abajo y arriba con el teclado sin romper HTML5', () => {
      vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
        data: {
          data: buildLongResults(12),
        } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
        isLoading: false,
        isError: false,
        isFetching: false,
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

      renderComponent();
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'lema' } });

      const listbox = screen.getByRole('listbox');
      const options = screen.getAllByRole('option');

      // Ningún <button> interactivo debe estar anidado dentro de <a role="option">
      for (const opt of options) {
        expect(opt.querySelector('button')).toBeNull();
      }

      // Simular geometría real del contenedor (altura visible 200px, cada opción de 60px, altura total 720px)
      Object.defineProperty(listbox, 'clientHeight', { configurable: true, value: 200 });
      Object.defineProperty(listbox, 'scrollHeight', { configurable: true, value: 720 });
      listbox.scrollTop = 0;

      options.forEach((opt, idx) => {
        Object.defineProperty(opt, 'offsetTop', { configurable: true, value: idx * 60 });
        Object.defineProperty(opt, 'offsetHeight', { configurable: true, value: 60 });
      });

      // Bajar hasta la opción 4 (índice 4 -> offsetTop 240, offsetBottom 300 > clientHeight 200)
      for (let i = 0; i < 5; i += 1) {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
      }
      expect(options[4]).toHaveAttribute('aria-selected', 'true');
      expect(listbox.scrollTop).toBe(300 + 6 - 200); // 106px

      // Saltar al final con Ctrl+End -> snap exacto al fondo (720 - 200 = 520px)
      fireEvent.keyDown(input, { key: 'End', ctrlKey: true });
      expect(options[11]).toHaveAttribute('aria-selected', 'true');
      expect(listbox.scrollTop).toBe(520);

      // Volver al inicio con Ctrl+Home -> snap exacto a 0
      fireEvent.keyDown(input, { key: 'Home', ctrlKey: true });
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(listbox.scrollTop).toBe(0);
    });

    it('selecciona el último elemento (N - 1) al presionar ArrowUp desde estado inicial (-1) y soporta Ctrl+N, Ctrl+P y PageDown', () => {
      vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
        data: {
          data: buildLongResults(8),
        } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
        isLoading: false,
        isError: false,
        isFetching: false,
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

      renderComponent();
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'lema' } });

      const options = screen.getAllByRole('option');

      // ArrowUp desde -1 debe ir al índice 7 (último), NO al penúltimo (6)
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(options[7]).toHaveAttribute('aria-selected', 'true');

      // Ctrl+N envuelve al índice 0
      fireEvent.keyDown(input, { key: 'n', ctrlKey: true });
      expect(options[0]).toHaveAttribute('aria-selected', 'true');

      // PageDown avanza +5 posiciones (0 -> 5)
      fireEvent.keyDown(input, { key: 'PageDown' });
      expect(options[5]).toHaveAttribute('aria-selected', 'true');

      // Ctrl+P retrocede 1 posición (5 -> 4)
      fireEvent.keyDown(input, { key: 'p', ctrlKey: true });
      expect(options[4]).toHaveAttribute('aria-selected', 'true');
    });

    it('inserta el grafema ɵ en la posición exacta del cursor con Alt+O y limpia con Ctrl+U', () => {
      renderComponent();
      const input = screen.getByRole('combobox') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'mrpik' } });
      input.setSelectionRange(1, 1);

      fireEvent.keyDown(input, { key: 'o', code: 'KeyO', altKey: true });
      expect(input).toHaveValue('mɵrpik');

      fireEvent.keyDown(input, { key: 'u', ctrlKey: true });
      expect(input).toHaveValue('');
    });

    it('ignora Enter durante composición IME activa (isComposing) y abre nueva pestaña con Ctrl+Enter', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      vi.mocked(dictionaryHooks.useSearchTerms).mockReturnValue({
        data: {
          data: buildLongResults(2),
        } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>['data'],
        isLoading: false,
        isError: false,
        isFetching: false,
      } as unknown as ReturnType<typeof dictionaryHooks.useSearchTerms>);

      renderComponent();
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'lema' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Simular Enter de confirmación de IME (isComposing: true) -> NO debe cerrar ni navegar
      fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Ctrl+Enter -> abre en nueva pestaña con noopener,noreferrer
      fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
      expect(openSpy).toHaveBeenCalledWith(
        '/campos/ya/nakchak/wammera#term-1',
        '_blank',
        'noopener,noreferrer',
      );
      openSpy.mockRestore();
    });
  });
});
