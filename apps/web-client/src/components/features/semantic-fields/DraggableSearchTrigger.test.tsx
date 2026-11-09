/**
 * DraggableSearchTrigger.test.tsx
 * Tests para el botón flotante reposicionable/arrastrable (Spec 012 / R-010)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';
import { DraggableSearchTrigger } from './DraggableSearchTrigger';
import { GlobalSearchModal } from './GlobalSearchModal';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

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

  it('permite activación accesible por teclado / lector de pantalla (click directo sin pointer events) y bloquea click residual tras arrastrar', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });

    // 1. Arrastre seguido del evento click sintético del navegador -> NO debe abrir el modal
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100, pointerId: 2 });
    fireEvent.pointerMove(btn, { clientX: 140, clientY: 150, pointerId: 2 });
    fireEvent.pointerUp(btn, { clientX: 140, clientY: 150, pointerId: 2 });
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
    unmount();

    // 2. Activación pura por teclado (Enter/Space) o VoiceOver/TalkBack -> dispara click sin pointerdown
    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );
    const kbBtn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
    fireEvent.click(kbBtn);
    expect(
      screen.queryByRole('button', { name: /Abrir buscador del diccionario/i }),
    ).not.toBeInTheDocument();
  });

  it('en móvil/táctil abre el modal con un solo tap en cualquier coordenada (incluso con micro-jitter <= 12px o tras arrastrar/rotar) y enfoca el input al 100%', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <GlobalSearchProvider>
            <DraggableSearchTrigger />
            <GlobalSearchModal />
          </GlobalSearchProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });

    // 1. Arrastre táctil (> 12px) hacia la parte inferior de la pantalla (zona de backdrop del modal)
    fireEvent.pointerDown(btn, {
      clientX: 300,
      clientY: 600,
      pointerId: 10,
      pointerType: 'touch',
    });
    fireEvent.touchStart(btn, { touches: [{ clientX: 300, clientY: 600 }] });
    fireEvent.pointerMove(btn, {
      clientX: 40,
      clientY: 520,
      pointerId: 10,
      pointerType: 'touch',
    });
    fireEvent.touchMove(btn, { touches: [{ clientX: 40, clientY: 520 }] });
    fireEvent.pointerUp(btn, {
      clientX: 40,
      clientY: 520,
      pointerId: 10,
      pointerType: 'touch',
    });
    fireEvent.touchEnd(btn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(btn).toHaveStyle({ left: '692px', top: '596px' });

    // 2. Simular cambio de orientación / resize móvil y luego un tap con micro-jitter táctil (8px <= 12px)
    window.dispatchEvent(new Event('orientationchange'));
    fireEvent.pointerDown(btn, {
      clientX: 692,
      clientY: 596,
      pointerId: 11,
      pointerType: 'touch',
    });
    fireEvent.touchStart(btn, { touches: [{ clientX: 692, clientY: 596 }] });
    // Micro-desplazamiento natural de la yema del dedo (8px <= 12px) NO debe tratarse como drag
    fireEvent.pointerMove(btn, {
      clientX: 697,
      clientY: 602,
      pointerId: 11,
      pointerType: 'touch',
    });
    fireEvent.pointerUp(btn, {
      clientX: 697,
      clientY: 602,
      pointerId: 11,
      pointerType: 'touch',
    });
    const touchEndEvent = new Event('touchend', { bubbles: true, cancelable: true });
    act(() => {
      btn.dispatchEvent(touchEndEvent);
    });

    // El evento touchend canceló la síntesis de ghost click del navegador móvil
    expect(touchEndEvent.defaultPrevented).toBe(true);

    // El modal está abierto y el input tiene el foco inmediatamente
    const dialog = screen.getByRole('dialog', { name: /Buscador global del diccionario/i });
    const input = screen.getByRole('combobox');
    expect(dialog).toBeInTheDocument();
    expect(document.activeElement).toBe(input);

    // Incluso si un WebView móvil dispara un mousedown + click fantasma residual en las coordenadas (45, 526)
    // sobre el backdrop o sobre el botón de cerrar sin pointerdown previo en el dialog:
    fireEvent.mouseDown(dialog, { clientX: 45, clientY: 526 });
    fireEvent.click(dialog, { clientX: 45, clientY: 526 });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.activeElement).toBe(input);

    // Cuando la persona usuaria realiza un toque real posterior en el backdrop (pointerdown + click), sí cierra
    fireEvent.pointerDown(dialog, { clientX: 45, clientY: 526, pointerType: 'touch' });
    fireEvent.click(dialog, { clientX: 45, clientY: 526 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('conserva exactamente la posición personalizada al abrir y cerrar el modal incluso con retracción del teclado virtual móvil', () => {
    const origWidth = window.innerWidth;
    const origHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 844,
    });

    try {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/']}>
            <GlobalSearchProvider>
              <DraggableSearchTrigger />
              <GlobalSearchModal />
            </GlobalSearchProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
      // Posición inicial en móvil 390x844: x = 318, y = 752
      expect(btn).toHaveStyle({ left: '318px', top: '752px' });

      // 1. Usuario arrastra la lupa a la esquina inferior izquierda (x = 16, y = 740)
      fireEvent.pointerDown(btn, { clientX: 318, clientY: 752, pointerId: 20 });
      fireEvent.pointerMove(btn, { clientX: 16, clientY: 740, pointerId: 20 });
      fireEvent.pointerUp(btn, { clientX: 16, clientY: 740, pointerId: 20 });
      expect(btn).toHaveStyle({ left: '16px', top: '740px' });

      // 2. Usuario toca la lupa para abrir el modal
      fireEvent.pointerDown(btn, { clientX: 16, clientY: 740, pointerId: 21 });
      fireEvent.pointerUp(btn, { clientX: 16, clientY: 740, pointerId: 21 });
      const dialog = screen.getByRole('dialog', { name: /Buscador global del diccionario/i });
      expect(dialog).toBeInTheDocument();

      // 3. El teclado virtual móvil (Gboard) se abre y reduce transitoriamente innerHeight a 460px
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 460,
      });
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // 4. Usuario cierra el modal mientras el teclado aún se está retrayendo (innerHeight = 460px)
      const closeBtn = screen.getByRole('button', { name: /Cerrar buscador/i });
      fireEvent.click(closeBtn);
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // La lupa reaparece inmediatamente en su coordenada exacta (16, 740) sin saltar a y = 388px
      const restoredBtn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
      expect(restoredBtn).toHaveStyle({ left: '16px', top: '740px' });

      // 5. El teclado termina de cerrarse (innerHeight vuelve a 844px)
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 844,
      });
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(restoredBtn).toHaveStyle({ left: '16px', top: '740px' });
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: origWidth,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: origHeight,
      });
    }
  });

  it('escala proporcionalmente al rotar la pantalla o redimensionar la ventana y restituye la coordenada exacta al volver al tamaño original', () => {
    const origWidth = window.innerWidth;
    const origHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 844,
    });

    try {
      render(
        <MemoryRouter initialEntries={['/']}>
          <GlobalSearchProvider>
            <DraggableSearchTrigger />
          </GlobalSearchProvider>
        </MemoryRouter>,
      );

      const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });

      // 1. En Portrait (390x844), el usuario arrastra la lupa a la esquina inferior izquierda (x = 16, y = 772)
      fireEvent.pointerDown(btn, { clientX: 318, clientY: 752, pointerId: 30 });
      fireEvent.pointerMove(btn, { clientX: 16, clientY: 772, pointerId: 30 });
      fireEvent.pointerUp(btn, { clientX: 16, clientY: 772, pointerId: 30 });
      expect(btn).toHaveStyle({ left: '16px', top: '772px' });

      // 2. Rotar a Landscape (844x390): la lupa se ajusta a la esquina inferior izquierda de Landscape (16, 318)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 844,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 390,
      });
      act(() => {
        window.dispatchEvent(new Event('orientationchange'));
        window.dispatchEvent(new Event('resize'));
      });
      expect(btn).toHaveStyle({ left: '16px', top: '318px' });

      // 3. Rotar de regreso a Portrait (390x844): restituye exactamente (16, 772) en vez de quedarse en y = 318px
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 390,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 844,
      });
      act(() => {
        window.dispatchEvent(new Event('orientationchange'));
        window.dispatchEvent(new Event('resize'));
      });
      expect(btn).toHaveStyle({ left: '16px', top: '772px' });
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: origWidth,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: origHeight,
      });
    }
  });

  it('persiste la posición al soltar cerca del borde de la ventana (lostpointercapture) y al navegar entre secciones o layouts', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/#inicio']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });

    // 1. Usuario arrastra la lupa hasta el borde izquierdo (x = 16, y = 420) y pierde captura de puntero al salir de la ventana
    fireEvent.pointerDown(btn, { clientX: 952, clientY: 676, pointerId: 40 });
    fireEvent.pointerMove(btn, { clientX: 16, clientY: 420, pointerId: 40 });
    fireEvent.lostPointerCapture(btn, { pointerId: 40 });
    expect(btn).toHaveStyle({ left: '16px', top: '420px' });

    // 2. Desmontar y montar en otra ruta/layout (p. ej. /campos/parentesco) conserva exactamente (16, 420)
    unmount();
    render(
      <MemoryRouter initialEntries={['/campos/parentesco']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    const remountedBtn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
    expect(remountedBtn).toHaveStyle({ left: '16px', top: '420px' });
  });

  it('aplica fallback seguro ante coordenadas fuera del viewport o datos corruptos en localStorage y permite reubicar con teclas de flecha', () => {
    // 1. Coordenadas extremas fuera del viewport (1024x768 -> maxX = 956, minY = 16)
    localStorage.setItem(
      'misak_search_fab_pos',
      JSON.stringify({
        x: 99999,
        y: -5000,
        xRatio: 50,
        yRatio: -10,
        viewportWidth: 1024,
        viewportHeight: 768,
      }),
    );

    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    const btn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
    expect(btn).toHaveStyle({ left: '956px', top: '16px' });

    // Desplazamiento accesible mediante teclado (ArrowLeft -15px, ArrowDown +15px)
    fireEvent.keyDown(btn, { key: 'ArrowLeft' });
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    expect(btn).toHaveStyle({ left: '941px', top: '31px' });
    unmount();

    // 2. JSON corrupto o valores nulos en localStorage -> fallback a esquina inferior derecha segura (952, 676)
    localStorage.setItem('misak_search_fab_pos', '{"x":null,"y":"invalid"}');
    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalSearchProvider>
          <DraggableSearchTrigger />
        </GlobalSearchProvider>
      </MemoryRouter>,
    );

    const fallbackBtn = screen.getByRole('button', { name: /Abrir buscador del diccionario/i });
    expect(fallbackBtn).toHaveStyle({ left: '952px', top: '676px' });
  });
});
