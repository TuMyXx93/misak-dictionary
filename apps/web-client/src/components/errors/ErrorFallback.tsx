import { Button } from '@components/ui/Button';
import { motion } from 'framer-motion';
import type { ErrorInfo } from 'react';

/**
 * ErrorFallback - UI de fallback profesional para ErrorBoundary
 *
 * Muestra un mensaje de error amigable al usuario con opciones
 * para recuperarse del error.
 */

interface ErrorFallbackProps {
  /** El error capturado */
  error: Error | null;
  /** Información adicional del error (component stack) */
  errorInfo: ErrorInfo | null;
  /** Función para resetear el error boundary */
  resetError: () => void;
}

export const ErrorFallback = ({ error, errorInfo, resetError }: ErrorFallbackProps) => {
  const isDev = import.meta.env.DEV;

  const handleReload = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-lg border-2 border-red-500/20 bg-background-secondary p-8 shadow-xl">
          {/* Icono de error */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-500/10 p-4">
              <svg
                className="h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h1 className="mb-4 text-center text-3xl font-bold text-text">¡Algo salió mal!</h1>

          {/* Mensaje */}
          <p className="mb-6 text-center text-lg text-text/70">
            Lo sentimos, ha ocurrido un error inesperado. Puedes intentar recargar la página o
            volver al inicio.
          </p>

          {/* Detalles del error (solo en desarrollo) */}
          {isDev && error && (
            <div className="mb-6 rounded-md bg-red-950/30 p-4">
              <h3 className="mb-2 font-mono text-sm font-semibold text-red-400">
                Error Details (Development Only):
              </h3>
              <div className="space-y-2">
                <p className="font-mono text-xs text-red-300">
                  <strong>Message:</strong> {error.message}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-mono text-xs text-red-300 hover:text-red-200">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-black/30 p-2 font-mono text-xs text-red-200">
                      {error.stack}
                    </pre>
                  </details>
                )}
                {errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-mono text-xs text-red-300 hover:text-red-200">
                      Component Stack
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-black/30 p-2 font-mono text-xs text-red-200">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={resetError}
              variant="primary"
              className="flex items-center justify-center gap-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Intentar de nuevo
            </Button>

            <Button
              onClick={handleReload}
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Volver al inicio
            </Button>
          </div>

          {/* Mensaje de ayuda */}
          <p className="mt-6 text-center text-sm text-text/50">
            Si el problema persiste, por favor contacta al soporte técnico.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
