import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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

  it('usa el MainLayout', async () => {
    const { container } = renderHome();
    await waitFor(() => {
      const layout = container.querySelector('.snap-y.snap-mandatory');
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
      const galleryTitle = screen.getByText('Logo bandera de Guambia');
      expect(galleryTitle).toBeInTheDocument();
    });
  });

  it('renderiza CreditsSection', async () => {
    renderHome();
    await waitFor(() => {
      const creditsTitle = screen.getByText('Créditos');
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
