import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('renderiza correctamente', () => {
    const { container } = render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    expect(container).toBeInTheDocument();
  });

  it('renderiza los children correctamente', () => {
    const { getByText } = render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('aplica snap-y y snap-mandatory para scroll', () => {
    const { container } = render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
    );

    const mainDiv = container.querySelector('.snap-y');
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass('snap-mandatory');
  });

  it('tiene overflow-y-scroll configurado', () => {
    const { container } = render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
    );

    const mainDiv = container.querySelector('.overflow-y-scroll');
    expect(mainDiv).toBeInTheDocument();
  });

  it('tiene altura de viewport completa', () => {
    const { container } = render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>,
    );

    const mainDiv = container.querySelector('.h-screen');
    expect(mainDiv).toBeInTheDocument();
  });

  it('permite múltiples children', () => {
    const { getByText } = render(
      <MainLayout>
        <div>First Section</div>
        <div>Second Section</div>
        <div>Third Section</div>
      </MainLayout>,
    );

    expect(getByText('First Section')).toBeInTheDocument();
    expect(getByText('Second Section')).toBeInTheDocument();
    expect(getByText('Third Section')).toBeInTheDocument();
  });
});
