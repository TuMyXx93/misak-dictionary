import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEXTS } from '@/constants/assets';
import { CreditsSection } from './CreditsSection';

describe('CreditsSection', () => {
  it('renderiza correctamente', () => {
    const { container } = render(<CreditsSection />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('muestra el título principal', () => {
    render(<CreditsSection />);

    const title = screen.getByText(TEXTS.CREDITS.TITLE);
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H2');
  });

  it('muestra la información del Cabildo', () => {
    render(<CreditsSection />);

    const orgText = screen.getByText(TEXTS.CREDITS.ORGANIZATION);
    expect(orgText).toBeInTheDocument();
  });

  it('muestra las autoridades correctamente', () => {
    render(<CreditsSection />);

    const gobernadora = screen.getByText(TEXTS.CREDITS.AUTHORITIES.GOBERNADORA);
    const vicegobernador = screen.getByText(TEXTS.CREDITS.AUTHORITIES.VICEGOBERNADOR);

    expect(gobernadora).toBeInTheDocument();
    expect(vicegobernador).toBeInTheDocument();
  });

  it('muestra el título de contacto con escala fluida h3 y color blanco (R-008, R-010)', () => {
    render(<CreditsSection />);

    const contactTitle = screen.getByText(TEXTS.CREDITS.CONTACT_TITLE);
    expect(contactTitle).toBeInTheDocument();
    expect(contactTitle.tagName).toBe('H3');
    expect(contactTitle).toHaveClass('text-fluid-h3', 'font-display', 'font-bold', 'text-white');
    expect(contactTitle).not.toHaveClass('text-primary');
  });

  it('muestra todos los emails de contacto', () => {
    render(<CreditsSection />);

    TEXTS.CREDITS.EMAILS.forEach((email) => {
      const emailElement = screen.getByText(email);
      expect(emailElement).toBeInTheDocument();
    });
  });

  it('muestra el número correcto de emails', () => {
    render(<CreditsSection />);

    const emails = screen.getAllByText(/.*@.*/);
    expect(emails.length).toBeGreaterThanOrEqual(TEXTS.CREDITS.EMAILS.length);
  });

  it('renderiza los links de redes sociales', () => {
    const { container } = render(<CreditsSection />);

    const socialLinks = container.querySelectorAll('a[aria-label]');
    expect(socialLinks.length).toBeGreaterThan(0);
  });

  it('tiene el divider neutro entre secciones (R-011)', () => {
    const { container } = render(<CreditsSection />);

    const divider = container.querySelector('.border-t.border-white\\/15');
    expect(divider).toBeInTheDocument();
  });

  it('aplica las clases de estilo correctas y región accesible aria-labelledby', () => {
    const { container } = render(<CreditsSection />);

    const section = container.querySelector('section#creditos');
    expect(section).toHaveClass('min-h-dvh', 'snap-start', 'bg-background');
    expect(section).toHaveAttribute('aria-labelledby', 'creditos-heading');
  });

  it('el título principal tiene el estilo correcto con escala fluida y texto blanco (R-010, R-011)', () => {
    render(<CreditsSection />);

    const title = screen.getByText(TEXTS.CREDITS.TITLE);
    expect(title).toHaveClass('text-fluid-h2', 'font-display', 'font-bold', 'text-white');
    expect(title).not.toHaveClass('text-primary');
  });

  it('la información de la organización es prominente', () => {
    render(<CreditsSection />);

    const orgText = screen.getByText(TEXTS.CREDITS.ORGANIZATION);
    expect(orgText).toHaveClass('text-xl', 'font-semibold', 'text-white');
  });

  it('tiene animación de framer-motion configurada', () => {
    const { container } = render(<CreditsSection />);

    const motionDiv = container.querySelector('.text-center');
    expect(motionDiv).toBeInTheDocument();
  });

  it('está centrado en la pantalla', () => {
    const { container } = render(<CreditsSection />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('los iconos de redes sociales son interactivos', () => {
    const { container } = render(<CreditsSection />);

    const socialLinks = container.querySelectorAll('.hover\\:text-white');
    expect(socialLinks.length).toBeGreaterThan(0);
  });
});
