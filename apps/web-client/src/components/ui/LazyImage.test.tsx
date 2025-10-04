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
});
