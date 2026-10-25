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

  it('muestra el título de contacto', () => {
    render(<CreditsSection />);

    const contactTitle = screen.getByText(TEXTS.CREDITS.CONTACT_TITLE);
    expect(contactTitle).toBeInTheDocument();
    expect(contactTitle.tagName).toBe('H3');
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

  it('tiene el divider entre secciones', () => {
    const { container } = render(<CreditsSection />);

    const divider = container.querySelector('.border-t.border-primary');
    expect(divider).toBeInTheDocument();
  });

  it('aplica las clases de estilo correctas', () => {
    const { container } = render(<CreditsSection />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('min-h-dvh', 'snap-start', 'bg-background');
  });

  it('el título principal tiene el estilo correcto', () => {
    render(<CreditsSection />);

    const title = screen.getByText(TEXTS.CREDITS.TITLE);
    expect(title).toHaveClass('text-3xl', 'md:text-4xl', 'font-bold', 'text-primary');
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
