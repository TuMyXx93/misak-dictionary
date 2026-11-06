/**
 * DraggableSearchTrigger.test.tsx
 * Tests para el botón flotante reposicionable/arrastrable (Spec 012 / R-010)
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';
import { DraggableSearchTrigger } from './DraggableSearchTrigger';

describe('DraggableSearchTrigger', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('se renderiza en rutas generales fuera de /campos', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
    expect(btn).toBeInTheDocument();
  });

  it('se oculta automáticamente cuando la ruta es exactamente /campos', () => {
    render(
      <MemoryRouter initialEntries={['/campos']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('button', { name: /Abrir buscador del diccionario/i }),
    ).not.toBeInTheDocument();
  });

  it('recupera la posición guardada en localStorage si existe', () => {
    localStorage.setItem('misak_search_fab_pos', JSON.stringify({ x: 120, y: 240 }));

    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
    expect(btn).toHaveStyle({ left: '120px', top: '240px' });
  });

  it('reubica el botón al arrastrar sin abrir el modal y lo oculta al tocar para abrir el buscador', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
    btn.setPointerCapture = () => {};
    btn.releasePointerCapture = () => {};

    // 1. Arrastre (> 6px): mantiene visible el botón en su nueva posición
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(btn, { clientX: 160, clientY: 220, pointerId: 1 });
    fireEvent.pointerUp(btn, { clientX: 160, clientY: 220, pointerId: 1 });
    expect(btn).toBeInTheDocument();

    // 2. Tap directo (sin movimiento): abre el modal y oculta el botón flotante mientras el modal está abierto
    fireEvent.pointerDown(btn, { clientX: 160, clientY: 220, pointerId: 1 });
    fireEvent.pointerUp(btn, { clientX: 160, clientY: 220, pointerId: 1 });

    expect(
      screen.queryByRole('button', { name: /Abrir buscador del diccionario/i }),
    ).not.toBeInTheDocument();
  });
});
