import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

/**
 * ErrorBoundary - Componente para capturar errores de React
 *
 * Captura errores en el árbol de componentes hijo, registra el error
 * y muestra una UI de fallback profesional en lugar de romper la app.
 *
 * Uso:
 * ```tsx
 * <ErrorBoundary>
 *   <ComponenteQuePodriaFallar />
 * </ErrorBoundary>
 * ```
 */

interface ErrorBoundaryProps {
  /** Componentes hijos a proteger */
  children: ReactNode;
  /** Callback opcional cuando ocurre un error */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** UI de fallback personalizada (opcional) */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Lifecycle method que actualiza el estado cuando hay un error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method que captura información del error y lo registra
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log del error para debugging
    console.error('🚨 Error caught by ErrorBoundary:', error);
    console.error('📍 Component stack:', errorInfo.componentStack);

    // Actualizar estado con errorInfo
    this.setState({
      errorInfo,
    });

    // Llamar al callback opcional si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: En producción, enviar a servicio de error tracking (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   errorTrackingService.captureException(error, {
    //     extra: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   });
    // }
  }

  /**
   * Resetea el error boundary para intentar renderizar de nuevo
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Si hay un fallback personalizado, usarlo
      if (fallback) {
        return fallback;
      }

      // Sino, usar el ErrorFallback por defecto
      return <ErrorFallback error={error} errorInfo={errorInfo} resetError={this.resetError} />;
    }

    // Si no hay error, renderizar children normalmente
    return children;
  }
}
