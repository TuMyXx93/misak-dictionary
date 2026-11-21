import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('usa fit="cover" por defecto y soporta fit="contain" con imgClassName y dimensiones en <img>', () => {
    const { container, rerender } = render(<LazyImage src="test.jpg" alt="Cover Image" />);

    const coverImg = screen.getByAltText('Cover Image');
    expect(coverImg).toHaveClass('object-cover', 'w-full', 'h-full');
    expect(container.firstElementChild).toHaveClass('overflow-hidden');

    rerender(
      <LazyImage
        src="test.jpg"
        alt="Contain Image"
        fit="contain"
        className="wrapper-contain"
        imgClassName="misak-lightbox-img rounded-lg"
        width={800}
        height={800}
      />,
    );

    const wrapper = container.querySelector('.wrapper-contain');
    const containImg = screen.getByAltText('Contain Image');
    expect(wrapper).toHaveClass(
      'flex',
      'items-center',
      'justify-center',
      'max-w-full',
      'max-h-full',
    );
    expect(wrapper).not.toHaveClass('overflow-hidden');
    expect(containImg).toHaveClass(
      'object-contain',
      'max-w-full',
      'max-h-full',
      'w-auto',
      'h-auto',
    );
    expect(containImg).toHaveClass('misak-lightbox-img', 'rounded-lg');
    expect(containImg).not.toHaveClass('object-cover');
    expect(containImg).toHaveAttribute('width', '800');
    expect(containImg).toHaveAttribute('height', '800');
  });

  it('propaga fit="contain", imgClassName y dimensiones intrínsecas dentro de <picture>', () => {
    const { container } = render(
      <LazyImage
        src="test.jpg"
        webpSrc="test.webp"
        alt="Picture Contain"
        fit="contain"
        imgClassName="picture-contain-img"
        width={640}
        height={640}
      />,
    );

    const picture = container.querySelector('picture');
    const img = screen.getByAltText('Picture Contain');

    expect(picture).toBeInTheDocument();
    expect(img).toHaveClass('object-contain', 'picture-contain-img');
    expect(img).not.toHaveClass('object-cover');
    expect(img).toHaveAttribute('width', '640');
    expect(img).toHaveAttribute('height', '640');
  });
});
