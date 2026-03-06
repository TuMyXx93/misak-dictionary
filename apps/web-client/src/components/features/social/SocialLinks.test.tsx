import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SocialLinks } from './SocialLinks';

describe('SocialLinks', () => {
  const mockLinks = [
    {
      name: 'Facebook',
      href: 'https://facebook.com',
      icon: <span data-testid="facebook-icon">FB</span>,
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      icon: <span data-testid="twitter-icon">TW</span>,
    },
  ];

  it('renderiza los links por defecto', () => {
    render(<SocialLinks />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3); // Facebook, Twitter, Instagram por defecto
  });

  it('renderiza links personalizados', () => {
    render(<SocialLinks links={mockLinks} />);

    const facebookLink = screen.getByLabelText('Facebook');
    const twitterLink = screen.getByLabelText('Twitter');

    expect(facebookLink).toBeInTheDocument();
    expect(twitterLink).toBeInTheDocument();
    expect(facebookLink).toHaveAttribute('href', 'https://facebook.com');
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
  });

  it('renderiza los íconos correctamente', () => {
    render(<SocialLinks links={mockLinks} />);

    const facebookIcon = screen.getByTestId('facebook-icon');
    const twitterIcon = screen.getByTestId('twitter-icon');

    expect(facebookIcon).toBeInTheDocument();
    expect(twitterIcon).toBeInTheDocument();
  });

  it('aplica clases CSS adicionales', () => {
    const { container } = render(<SocialLinks className="custom-class" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('aplica aria-label a cada link', () => {
    render(<SocialLinks links={mockLinks} />);

    const facebookLink = screen.getByLabelText('Facebook');
    const twitterLink = screen.getByLabelText('Twitter');

    expect(facebookLink).toHaveAttribute('aria-label', 'Facebook');
    expect(twitterLink).toHaveAttribute('aria-label', 'Twitter');
  });

  it('aplica clases de hover y transición', () => {
    render(<SocialLinks links={mockLinks} />);

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('text-gray-400', 'hover:text-white', 'transition-colors');
    });
  });
});
