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

vi.mock('./AudioPlayButton', () => ({
  AudioPlayButton: ({ src, label }: { src: string; label?: string }) => (
    <button type="button" data-testid="audio-play-button" aria-label={label ?? 'Reproducir audio'}>
      {src}
    </button>
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

  it('soporta tipo video con subtítulos accesibles y etiquetas correspondientes', () => {
    const videoMedia: CulturalMediaItem = {
      src: '/media/video.mp4',
      tipo: 'video',
      alt: 'Danza Misak',
      metadata: { captionsUrl: '/captions/danza.vtt' },
    };

    render(<CulturalMediaLightbox isOpen={true} onClose={mockOnClose} media={videoMedia} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Video cultural: Danza Misak');
    expect(screen.getByRole('button', { name: 'Cerrar visor multimedia cultural' })).toBeDefined();
    const video = dialog.querySelector('video');
    expect(video).toBeDefined();
    const track = dialog.querySelector('track');
    expect(track?.getAttribute('src')).toBe('/captions/danza.vtt');
  });

  it('soporta tipo audio y fallback sin texto alternativo', () => {
    const audioMedia: CulturalMediaItem = {
      src: '/media/canto.mp3',
      tipo: 'audio',
      alt: 'Canto Ancestral',
    };

    const { unmount } = render(
      <CulturalMediaLightbox isOpen={true} onClose={mockOnClose} media={audioMedia} />,
    );
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe(
      'Recurso cultural: Canto Ancestral',
    );
    unmount();

    const noAltMedia: CulturalMediaItem = {
      src: '/media/sin-alt.jpg',
      tipo: 'imagen',
      alt: '',
    };
    render(<CulturalMediaLightbox isOpen={true} onClose={mockOnClose} media={noAltMedia} />);
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe(
      'Visor de ilustración cultural',
    );
  });

  it('no cierra el modal al hacer clic en el contenido interior y gestiona foco con triggerRef', () => {
    const triggerBtn = document.createElement('button');
    document.body.appendChild(triggerBtn);
    const triggerRef = { current: triggerBtn };

    const { rerender } = render(
      <CulturalMediaLightbox
        isOpen={true}
        onClose={mockOnClose}
        media={sampleMedia}
        triggerRef={triggerRef}
      />,
    );

    const closeBtn = screen.getByRole('button', { name: 'Cerrar visor de imagen cultural' });
    if (closeBtn.parentElement) {
      fireEvent.click(closeBtn.parentElement); // clic en contenedor, no en backdrop directo
    }
    expect(mockOnClose).not.toHaveBeenCalled();

    // Focus trap test con Tab
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false });
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });

    // Cerrar y verificar restauración de foco
    rerender(
      <CulturalMediaLightbox
        isOpen={false}
        onClose={mockOnClose}
        media={sampleMedia}
        triggerRef={triggerRef}
      />,
    );
    expect(document.activeElement).toBe(triggerBtn);
    document.body.removeChild(triggerBtn);
  });
});
