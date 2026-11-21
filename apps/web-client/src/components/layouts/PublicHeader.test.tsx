import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PublicHeader } from './PublicHeader';

describe('PublicHeader', () => {
  it('no muestra acceso editorial en el header público', () => {
    render(
      <MemoryRouter>
        <PublicHeader mainTargetId="main-content" variant="sticky" />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Acceso Editorial')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Acceso Editorial/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Buscar en el diccionario/i }),
    ).not.toBeInTheDocument();
  });

  it('resalta "Campos Semánticos" como activo cuando la ruta es /campos', () => {
    render(
      <MemoryRouter initialEntries={['/campos']}>
        <PublicHeader mainTargetId="main-content" variant="sticky" />
      </MemoryRouter>,
    );

    const camposLink = screen.getByRole('link', { name: 'Campos semánticos' });
    expect(camposLink).toHaveAttribute('aria-current', 'page');
    expect(camposLink).toHaveClass('bg-[#0055AA]/30');

    const recorridoLink = screen.getByRole('link', { name: 'Recorrido' });
    expect(recorridoLink).not.toHaveAttribute('aria-current');
  });

  it('resalta "Recorrido" cuando activeSection es recorrido en la Home', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PublicHeader mainTargetId="main-content" activeSection="recorrido" />
      </MemoryRouter>,
    );

    const recorridoLink = screen.getByRole('link', { name: 'Recorrido' });
    expect(recorridoLink).toHaveAttribute('aria-current', 'page');
    expect(recorridoLink).toHaveClass('bg-[#0055AA]/30');

    const camposLink = screen.getByRole('link', { name: 'Campos semánticos' });
    expect(camposLink).not.toHaveAttribute('aria-current');
  });

  it('aplica clases de ocultamiento cuando isVisible es false', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <PublicHeader mainTargetId="main-content" isVisible={false} />
      </MemoryRouter>,
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('opacity-0', '-translate-y-full', 'pointer-events-none');
  });

  it('navega efectivamente a /campos al hacer clic en "Campos semánticos" desde el Home con #inicio presente (R-024)', () => {
    const scrollIntoViewMock = vi.fn();

    render(
      <MemoryRouter initialEntries={['/']}>
        <PublicHeader mainTargetId="main-content" activeSection="recorrido" />
        <Routes>
          <Route
            path="/"
            element={
              <main id="main-content">
                <section
                  id="inicio"
                  ref={(el) => {
                    if (el) {
                      el.scrollIntoView = scrollIntoViewMock;
                    }
                  }}
                >
                  Hero Home
                </section>
              </main>
            }
          />
          <Route path="/campos" element={<div data-testid="campos-view">Vista Campos</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const camposLink = screen.getByRole('link', { name: 'Campos semánticos' });
    fireEvent.click(camposLink);

    expect(screen.getByTestId('campos-view')).toBeInTheDocument();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Campos semánticos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Campos' })).toHaveAttribute('aria-current', 'page');
  });

  it('navega a /campos desde el menú móvil colapsado (drawer) estando en el Home (R-024)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PublicHeader mainTargetId="main-content" activeSection="recorrido" />
        <Routes>
          <Route
            path="/"
            element={
              <main id="main-content">
                <section id="inicio">Hero Home</section>
              </main>
            }
          />
          <Route path="/campos" element={<div data-testid="campos-view">Vista Campos</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: 'Abrir menú de navegación' });
    fireEvent.click(menuButton);

    const drawerNav = screen.getByRole('navigation', { name: 'Menú móvil del diccionario' });
    expect(drawerNav).toBeInTheDocument();

    const camposLinks = screen.getAllByRole('link', { name: /Campos semánticos/i });
    const drawerCamposLink = camposLinks[camposLinks.length - 1];
    expect(drawerCamposLink).toBeDefined();
    if (drawerCamposLink) {
      fireEvent.click(drawerCamposLink);
    }

    expect(screen.getByTestId('campos-view')).toBeInTheDocument();
  });

  it('devuelve el foco al botón disparador al cerrar el cajón móvil con el botón de cierre', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PublicHeader mainTargetId="main-content" activeSection="inicio" />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: 'Abrir menú de navegación' });
    fireEvent.click(menuButton);

    const closeButton = screen.getByRole('button', { name: 'Cerrar menú' });
    closeButton.focus();
    fireEvent.click(closeButton);

    expect(
      screen.queryByRole('navigation', { name: 'Menú móvil del diccionario' }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(document.activeElement).toBe(menuButton);
    });
  });
});
