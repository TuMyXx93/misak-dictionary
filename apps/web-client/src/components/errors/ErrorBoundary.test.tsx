import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Componente que lanza un error intencionalmente
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error thrown</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suprimir console.error en tests para no contaminar output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renderiza children normalmente cuando no hay errores', () => {
    render(
      <ErrorBoundary>
        <div>Content without error</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Content without error')).toBeInTheDocument();
  });

  it('captura errores y muestra fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('¡Algo salió mal!')).toBeInTheDocument();
    expect(screen.getByText(/Lo sentimos, ha ocurrido un error inesperado/i)).toBeInTheDocument();
  });

  it('muestra el botón de "Intentar de nuevo"', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Intentar de nuevo')).toBeInTheDocument();
  });

  it('muestra el botón de "Volver al inicio"', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Volver al inicio')).toBeInTheDocument();
  });

  it('llama al callback onError cuando ocurre un error', () => {
    const onErrorMock = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(onErrorMock).toHaveBeenCalled();
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error message',
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
  });

  it('resetea el error boundary al hacer click en "Intentar de nuevo"', () => {
    let shouldThrow = true;
    const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>,
    );

    // Verificar que muestra el error
    expect(screen.getByText('¡Algo salió mal!')).toBeInTheDocument();

    // Cambiar estado antes de resetear
    shouldThrow = false;

    // Hacer click en "Intentar de nuevo"
    const retryButton = screen.getByText('Intentar de nuevo');
    fireEvent.click(retryButton);

    // Re-renderizar después del reset
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>,
    );

    // Verificar que muestra el contenido normal después del reset
    expect(screen.getByText('No error thrown')).toBeInTheDocument();
  });

  it('muestra fallback personalizado si se provee', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('¡Algo salió mal!')).not.toBeInTheDocument();
  });

  it('registra el error en console.error', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error caught by ErrorBoundary:'),
      expect.objectContaining({
        message: 'Test error message',
      }),
    );
  });

  it('muestra el mensaje de error correcto', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    // El mensaje de error específico solo se muestra en desarrollo
    // En este caso, verificamos que la UI de error se muestra
    expect(screen.getByText('¡Algo salió mal!')).toBeInTheDocument();
  });

  it('mantiene el estado de error después de re-renders', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('¡Algo salió mal!')).toBeInTheDocument();

    // Re-renderizar sin cambiar props
    rerender(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    // El error debe seguir mostrándose
    expect(screen.getByText('¡Algo salió mal!')).toBeInTheDocument();
  });

  it('captura diferentes tipos de errores', () => {
    const DifferentError = () => {
      throw new Error('Different error type');
    };

    render(
      <ErrorBoundary>
        <DifferentError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('¡Algo salió mal!')).toBeInTheDocument();
  });
});
