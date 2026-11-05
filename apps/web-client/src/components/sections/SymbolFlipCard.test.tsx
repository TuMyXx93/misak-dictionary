import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEXTS } from '@/constants/assets';
import { type GallerySymbolItem, SymbolFlipCard } from './SymbolFlipCard';

const MOCK_BANDERA_ITEM: GallerySymbolItem = {
  id: 1,
  url: '/brand/bandera-misak.png',
  webpUrl: '/brand/bandera-misak.webp',
  alt: 'Bandera oficial del Pueblo Misak',
  title: 'Bandera del pueblo Misak',
  subtitle: 'Magenta · Azul Piurek · Blanco · Negro Nupirau',
  containEmblem: true,
  details: TEXTS.GALLERY.IMAGES[0].details,
};

const MOCK_ESCUDO_ITEM: GallerySymbolItem = {
  id: 2,
  url: '/brand/escudo-misak.png',
  webpUrl: '/brand/escudo-misak.webp',
  alt: 'Escudo oficial del Resguardo Indígena de Guambia',
  title: 'Escudo del pueblo Misak',
  subtitle: 'Autoridad ancestral, territorio y palabra viva',
  containEmblem: true,
  details: TEXTS.GALLERY.IMAGES[1].details,
};

const MOCK_LOGO_ITEM: GallerySymbolItem = {
  id: 3,
  url: 'https://api.iconify.design/mdi/book-open-variant.svg',
  alt: 'Icono temporal de libro abierto',
  title: 'Logo del equipo lingüístico Misak',
  subtitle: 'Investigación comunitaria Namtrik – Castellano',
  containEmblem: false,
};

describe('SymbolFlipCard — Tarjeta Interactiva con Volteo 3D (Spec 009 Enmienda 0.3.0)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renderiza la cara frontal del emblema inicialmente con su título', () => {
    render(<SymbolFlipCard item={MOCK_BANDERA_ITEM} index={0} />);

    expect(screen.getByText('Bandera del pueblo Misak')).toBeInTheDocument();
    expect(screen.getByText('Ver significado')).toBeInTheDocument();
  });

  it('voltea la tarjeta al recibir clic o Enter y muestra el reverso informativo completo', () => {
    render(<SymbolFlipCard item={MOCK_BANDERA_ITEM} index={0} />);

    const card = screen.getByRole('button', { name: /Bandera del pueblo Misak/i });
    expect(card).toHaveAttribute('aria-expanded', 'false');

    // Activar volteo con clic
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');

    // Verifica que el contenido detallado de la bandera esté visible
    expect(
      screen.getByText(/La bandera Guambiana está conformada por cuatro franjas horizontales/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nuestra Bandera Guambiana fue creada en 1\.980/i)).toBeInTheDocument();
  });

  it('el reverso del Escudo contiene los términos en Namtrik con grafema canónico U+0275 (R-019)', () => {
    render(<SymbolFlipCard item={MOCK_ESCUDO_ITEM} index={1} />);

    const card = screen.getByRole('button', { name: /Escudo del pueblo Misak/i });
    fireEvent.click(card);

    // Términos Namtrik canónicos (Kɵtrak, Kausrɵ, Tsurɵpall, pishintɵ waramik)
    expect(screen.getByText(/El fondo azul claro, es el Kɵtrak/i)).toBeInTheDocument();
    expect(screen.getByText(/es el Kausrɵ/i)).toBeInTheDocument();
    expect(screen.getByText(/La Bandera Tsurɵpall le da la vuelta/i)).toBeInTheDocument();
    expect(screen.getByText(/el blanco es el pishintɵ waramik/i)).toBeInTheDocument();
    expect(screen.getByText(/El Escudo es el Nuisuik/i)).toBeInTheDocument();
  });

  it('cierra la tarjeta y regresa a la imagen al presionar Escape o el botón de cierre', () => {
    render(<SymbolFlipCard item={MOCK_BANDERA_ITEM} index={0} />);

    const card = screen.getByRole('button', { name: /Bandera del pueblo Misak/i });
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');

    // Cerrar con Escape
    fireEvent.keyDown(card, { key: 'Escape' });
    expect(card).toHaveAttribute('aria-expanded', 'false');

    // Volver a abrir y cerrar con el botón de la X
    fireEvent.click(card);
    const closeBtn = screen.getByLabelText('Volver al emblema');
    fireEvent.click(closeBtn);
    expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  it('la tarjeta del Logo sin details permanece estática y no tiene botón de volteo (R-020)', () => {
    render(<SymbolFlipCard item={MOCK_LOGO_ITEM} index={2} />);

    expect(screen.getByText('Logo del equipo lingüístico Misak')).toBeInTheDocument();
    expect(screen.queryByText('Ver significado')).toBeNull();
    expect(screen.queryByRole('button', { name: /Logo del equipo lingüístico Misak/i })).toBeNull();
  });
});
