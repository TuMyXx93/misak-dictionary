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

  it('enfoca automáticamente el campo de búsqueda al activar Ctrl+K o `/` y configura closedby="any"', () => {
    window.history.pushState({}, '', '/');
    renderWithProviders();

    // Activar con atajo global Ctrl+K -> 1 sola acción abre y enfoca el input
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const dialog = screen.getByRole('dialog', { name: /Buscador global del diccionario/i });
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('closedby', 'any');

    const input = screen.getByRole('combobox');
    expect(document.activeElement).toBe(input);

    // Cerrar y reabrir mediante atajo rápido `/`
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: '/' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
  });

  it('en /campos enfoca directamente #dictionary-search sin abrir el modal duplicado y aísla /admin/*', () => {
    window.history.pushState({}, '', '/campos');
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/campos']}>
          <GlobalSearchProvider>
            <input id="dictionary-search" type="text" defaultValue="consulta previa" />
            <GlobalSearchModal />
          </GlobalSearchProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const inlineInput = document.getElementById('dictionary-search') as HTMLInputElement;
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(inlineInput);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // En /admin/* los atajos públicos no deben interceptar ni abrir el modal público
    window.history.pushState({}, '', '/admin/sentidos');
    inlineInput.blur();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(window, { key: '/' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    window.history.pushState({}, '', '/');
  });
});
