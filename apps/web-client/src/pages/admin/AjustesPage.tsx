/**
 * AjustesPage
 * Spec 006 (R-026, T-050)
 * Configuración global del sistema editorial y control de la bandera PUBLIC_ONLY_RATIFIED.
 * Restringido exclusivamente al rol super_admin.
 */

import { useEffect, useState } from 'react';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';

export function AjustesPage() {
  const { hasRole } = useAuthStore();
  const isSuperAdmin = hasRole('super_admin');

  const { data: settings, isLoading, isError, error } = useSystemSettings();
  const updateSettingsMutation = useUpdateSystemSettings();

  const [publicOnlyRatified, setPublicOnlyRatified] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (settings) {
      setPublicOnlyRatified(Boolean(settings.publicOnlyRatified));
    }
  }, [settings]);

  if (!isSuperAdmin) {
    return (
      <div role="alert" className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-lg">
        <h2 className="text-lg font-bold mb-1">Acceso Denegado</h2>
        <p className="text-sm">
          Esta sección de ajustes globales está restringida exclusivamente a usuarios con rol{' '}
          <span className="font-mono font-semibold">super_admin</span> (R-026).
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-500" role="status">
        Cargando ajustes del sistema...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"
      >
        Error al cargar ajustes: {error instanceof Error ? error.message : 'Error desconocido'}
      </div>
    );
  }

  const handleToggle = async () => {
    const nextVal = !publicOnlyRatified;
    setFeedback(null);

    try {
      await updateSettingsMutation.mutateAsync({
        publicOnlyRatified: nextVal,
      });
      setPublicOnlyRatified(nextVal);
      setFeedback({
        type: 'success',
        text: `Bandera PUBLIC_ONLY_RATIFIED actualizada a ${nextVal ? 'Activada' : 'Desactivada'}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar configuración.';
      setFeedback({ type: 'error', text: msg });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Ajustes Globales del Sistema
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Parámetros operativos y políticas de visibilidad pública del léxico (R-026).
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-md text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Políticas de Visibilidad Pública (R-026)
          </h2>
          <p className="text-sm text-slate-600">
            Controla cómo los visitantes y la comunidad consultan las entradas léxicas en la
            interfaz pública del diccionario.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-start justify-between gap-6">
          <div className="flex-1">
            <label
              htmlFor="toggle-public-only-ratified"
              className="text-base font-medium text-slate-900 block cursor-pointer"
            >
              Modo estricto: Solo entradas ratificadas (PUBLIC_ONLY_RATIFIED)
            </label>
            <p className="text-sm text-slate-500 mt-1">
              {publicOnlyRatified ? (
                <span className="text-emerald-700 font-medium">
                  Activo: El diccionario público oculta completamente los borradores; solo las
                  palabras aprobadas formalmente son visibles.
                </span>
              ) : (
                <span className="text-slate-600">
                  Inactivo: El público visualiza tanto entradas ratificadas como borradores (estos
                  últimos marcados con la insignia accesible «En revisión»).
                </span>
              )}
            </p>
          </div>

          <button
            id="toggle-public-only-ratified"
            type="button"
            role="switch"
            aria-checked={publicOnlyRatified}
            disabled={updateSettingsMutation.isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] items-center p-1 ${
              publicOnlyRatified ? 'bg-sky-700' : 'bg-slate-300'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                publicOnlyRatified ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-lg text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Nota de Gobierno:</span> Toda alteración a
          este parámetro queda registrada en el log inmutable de auditoría con el usuario
          responsable (R-019).
        </div>
      </div>
    </div>
  );
}
