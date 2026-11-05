/**
 * GlobalSearchModal.test.tsx
 * Tests para el modal accesible de búsqueda global (Spec 012 / R-010)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { GlobalSearchProvider, useGlobalSearch } from '@/contexts/GlobalSearchContext';
import { GlobalSearchModal } from './GlobalSearchModal';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const TriggerComponent = () => {
  const { openSearch } = useGlobalSearch();
  return (
    <button type="button" onClick={openSearch}>
      Abrir modal test
    </button>
  );
};

const renderWithProviders = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GlobalSearchProvider>
          <TriggerComponent />
          <GlobalSearchModal />
        </GlobalSearchProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('GlobalSearchModal', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('no muestra el modal inicialmente cuando isOpen es false', () => {
    renderWithProviders();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre el modal accesible con role="dialog" al invocar openSearch', () => {
    renderWithProviders();
    const trigger = screen.getByText('Abrir modal test');
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: /Buscador global del diccionario/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('cierra el modal al hacer clic en el botón de cerrar', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('Abrir modal test'));

    const closeBtn = screen.getByRole('button', { name: /Cerrar buscador/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra el modal con tecla Escape', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('Abrir modal test'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
