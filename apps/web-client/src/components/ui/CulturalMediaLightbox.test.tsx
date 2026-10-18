/**
 * CulturalMediaLightbox.test.tsx — Phase 5 · Spec 007
 *
 * Tests unitarios para el visor modal CulturalMediaLightbox (R-011):
 * - Cumplimiento WAI-ARIA (role="dialog", aria-modal="true").
 * - Comportamiento de cierre con Escape, backdrop y botón.
 * - Exhibición de créditos culturales comunitarios.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type CulturalMediaItem, CulturalMediaLightbox } from './CulturalMediaLightbox';

// Mock de LazyImage para aislar el test del diálogo
vi.mock('./LazyImage', () => ({
  LazyImage: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="lightbox-image" />
  ),
}));

describe('CulturalMediaLightbox', () => {
  const sampleMedia: CulturalMediaItem = {
    src: '/api/media/uuid-img-1/stream',
    alt: 'Sombrero tradicional Misak (Tampal)',
    descripcionEspanol: 'Prenda tradicional elaborada en lana virgen.',
    descripcionNamtrik: 'Tampal k+shk+',
    autor: 'Mama Rosa',
    variante: 'Guambía Central',
    licencia: 'Propiedad Intelectual Colectiva del Pueblo Misak',
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza contenido cuando isOpen es false', () => {
    render(<CulturalMediaLightbox isOpen={false} onClose={mockOnClose} media={sampleMedia} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza con atributos accesibles obligatorios (role="dialog", aria-modal="true") cuando isOpen es true (R-011)', () => {
    render(<CulturalMediaLightbox isOpen={true} onClose={mockOnClose} media={sampleMedia} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe(
      'Ilustración cultural: Sombrero tradicional Misak (Tampal)',
    );
  });

  it('llama a onClose al presionar la tecla Escape', () => {
    render(<CulturalMediaLightbox isOpen={true} onClose={mockOnClose} media={sampleMedia} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('llama a onClose al pulsar el botón de cierre accesible', () => {
    render(<CulturalMediaLightbox isOpen={true} onClose={mockOnClose} media={sampleMedia} />);

    const closeButton = screen.getByRole('button', {
      name: 'Cerrar visor de imagen cultural',
    });
    expect(closeButton.className).toContain('min-w-[48px]');
    expect(closeButton.className).toContain('min-h-[48px]');

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('llama a onClose al hacer clic en el backdrop', () => {
    render(<CulturalMediaLightbox isOpen={true} onClose={mockOnClose} media={sampleMedia} />);

    const dialogBackdrop = screen.getByRole('dialog');
    fireEvent.click(dialogBackdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('muestra correctamente la ficha de metadatos culturales y licencia colectiva', () => {
    render(<CulturalMediaLightbox isOpen={true} onClose={mockOnClose} media={sampleMedia} />);

    expect(screen.getByText('«Tampal k+shk+»')).toBeDefined();
    expect(screen.getByText('Prenda tradicional elaborada en lana virgen.')).toBeDefined();
    expect(screen.getByText('Mama Rosa')).toBeDefined();
    expect(screen.getByText('Guambía Central')).toBeDefined();
    expect(screen.getByText('Propiedad Intelectual Colectiva del Pueblo Misak')).toBeDefined();
  });
});
