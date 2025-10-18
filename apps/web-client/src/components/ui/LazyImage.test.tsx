import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LazyImage } from './LazyImage';

// Mock del hook useLazyImage
vi.mock('@/hooks/useLazyImage', () => ({
  useLazyImage: vi.fn(() => ({
    imageSrc: 'test-image.jpg',
    isLoaded: true,
    imgRef: { current: null },
  })),
}));

describe('LazyImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente con props básicas', () => {
    render(<LazyImage src="test.jpg" alt="Test Image" />);

    const img = screen.getByAltText('Test Image');
    expect(img).toBeInTheDocument();
  });

  it('aplica clases CSS adicionales', () => {
    const { container } = render(
      <LazyImage src="test.jpg" alt="Test Image" className="custom-class" />,
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('muestra la imagen cuando está cargada', () => {
    render(<LazyImage src="test.jpg" alt="Test Image" />);

    const img = screen.getByAltText('Test Image');
    expect(img).toHaveAttribute('src', 'test-image.jpg');
    expect(img).toHaveClass('opacity-100');
  });

  it('pasa props adicionales a motion.img', () => {
    render(<LazyImage src="test.jpg" alt="Test Image" data-testid="lazy-img" />);

    const img = screen.getByTestId('lazy-img');
    expect(img).toBeInTheDocument();
  });

  it('soporta srcSet y sizes en img', () => {
    render(
      <LazyImage
        src="test.jpg"
        alt="Test Image"
        srcSet="test-320.jpg 320w, test-640.jpg 640w"
        sizes="(max-width: 600px) 100vw, 50vw"
      />,
    );

    const img = screen.getByAltText('Test Image');
    expect(img).toHaveAttribute('srcset', 'test-320.jpg 320w, test-640.jpg 640w');
    expect(img).toHaveAttribute('sizes', '(max-width: 600px) 100vw, 50vw');
  });

  it('renderiza <picture> con WebP cuando se provee webpSrc', () => {
    const { container } = render(
      <LazyImage
        src="test.jpg"
        alt="Test Image"
        webpSrc="test.webp"
        srcSet="test-320.jpg 320w, test-640.jpg 640w"
        webpSrcSet="test-320.webp 320w, test-640.webp 640w"
        sizes="(max-width: 600px) 100vw, 50vw"
      />,
    );

    const picture = container.querySelector('picture');
    const source = container.querySelector('source[type="image/webp"]');
    const img = screen.getByAltText('Test Image');

    expect(picture).toBeInTheDocument();
    expect(source).toBeInTheDocument();
    expect(source).toHaveAttribute('srcset', 'test-320.webp 320w, test-640.webp 640w');
    expect(img).toHaveAttribute('srcset', 'test-320.jpg 320w, test-640.jpg 640w');
  });
});
