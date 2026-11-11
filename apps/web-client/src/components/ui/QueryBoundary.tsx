/**
 * QueryBoundary Components
 * Spec 003 — Integración vertical
 * Estados de carga/error para vistas alimentadas por API.
 */

export const DataLoading = ({ label = 'Cargando…' }: { label?: string }) => (
  <output className="flex items-center justify-center py-16" aria-live="polite">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-sm">{label}</p>
    </div>
  </output>
);

export const DataError = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex items-center justify-center py-16" role="alert">
    <div className="text-center">
      <p className="text-lg text-primary mb-2">No pudimos cargar el contenido</p>
      <p className="text-sm text-text-muted mb-4">Verifica tu conexión e inténtalo de nuevo.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  </div>
);
