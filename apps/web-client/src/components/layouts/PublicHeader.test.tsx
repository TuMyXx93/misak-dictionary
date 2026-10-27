import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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
  });

  it('resalta "Campos Semánticos" como activo cuando la ruta es /campos', () => {
    render(
      <MemoryRouter initialEntries={['/campos']}>
        <PublicHeader mainTargetId="main-content" variant="sticky" />
      </MemoryRouter>,
    );

    const camposLink = screen.getByRole('link', { name: 'Campos Semánticos' });
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

    const camposLink = screen.getByRole('link', { name: 'Campos Semánticos' });
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
});
