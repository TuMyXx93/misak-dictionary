import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { IMAGES } from '@/constants/assets';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import { Home } from './Home';

const renderHome = () =>
  renderWithQueryClient(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </MemoryRouter>,
  );

describe('Home', () => {
  it('renderiza correctamente', async () => {
    renderHome();
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('mantiene la cabecera pública oculta en el Hero inicial de la home', async () => {
    const { container } = renderHome();
    await waitFor(() => {
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('opacity-0', '-translate-y-full', 'pointer-events-none');
    });
  });

  it('omite los elementos editoriales retirados del contenido del home', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.queryByText('Pueblo Misak · Resguardo de Guambia')).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          'Explora la palabra viva a través del territorio, la memoria oral y los campos semánticos ancestrales.',
        ),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Memoria Audiovisual · Nupirau')).not.toBeInTheDocument();
      expect(screen.queryByText('Cosmovisión y Lengua Namtrik')).not.toBeInTheDocument();
      expect(screen.queryByText('Magenta')).not.toBeInTheDocument();
      expect(screen.queryByText('Azul Piurek')).not.toBeInTheDocument();
      expect(screen.queryByText('Blanco')).not.toBeInTheDocument();
      expect(screen.queryByText('Negro Nupirau')).not.toBeInTheDocument();
      expect(screen.queryByText('Identidad y Autoridad Ancestral')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Magenta · Azul Piurek · Blanco · Negro Nupirau'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Autoridad ancestral, territorio y palabra viva'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Investigación comunitaria Namtrik – Castellano'),
      ).not.toBeInTheDocument();
    });
  });

  it('usa el MainLayout con ámbito público oscuro Misak', async () => {
    const { container } = renderHome();
    await waitFor(() => {
      const layout = container.querySelector('.misak-public-scope.snap-y');
      expect(layout).toBeInTheDocument();
    });
  });

  it('renderiza HeroSection', async () => {
    renderHome();
    await waitFor(() => {
      const heroTitle = screen.getByText('Diccionario Misak');
      expect(heroTitle).toBeInTheDocument();
    });
  });

  it('renderiza VideoSection', async () => {
    const { container } = renderHome();
    await waitFor(() => {
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
    });
  });

  it('renderiza InfoSection', async () => {
    renderHome();
    await waitFor(() => {
      const infoTitle = screen.getByText('El Territorio como Metáfora');
      expect(infoTitle).toBeInTheDocument();
    });
  });

  it('renderiza GallerySection', async () => {
    renderHome();
    await waitFor(() => {
      const galleryTitle = screen.getByText('Bandera del pueblo Misak');
      expect(galleryTitle).toBeInTheDocument();
      expect(IMAGES.GALLERY.LINGUISTIC_TEAM_TEMP).not.toBe(IMAGES.HERO);
      expect(IMAGES.GALLERY.LINGUISTIC_TEAM_TEMP).toContain(
        'https://api.iconify.design/mdi/book-open-variant.svg',
      );
    });
  });

  it('renderiza CreditsSection', async () => {
    renderHome();
    await waitFor(() => {
      const creditsTitle = screen.getByText('Créditos Institucionales');
      expect(creditsTitle).toBeInTheDocument();
    });
  });

  it('todas las secciones están en el orden correcto', async () => {
    const { container } = renderHome();
    await waitFor(() => {
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBe(5);
    });
  });

  it('cada sección tiene snap-start para scroll', async () => {
    const { container } = renderHome();
    await waitFor(() => {
      const sections = container.querySelectorAll('section.snap-start');
      expect(sections.length).toBe(5);
    });
  });

  it('todas las secciones tienen altura completa', async () => {
    const { container } = renderHome();
    await waitFor(() => {
      const fullHeightSections = Array.from(container.querySelectorAll('section')).filter(
        (s) => s.classList.contains('h-screen') || s.classList.contains('min-h-dvh'),
      );
      expect(fullHeightSections.length).toBe(5);
    });
  });
});
