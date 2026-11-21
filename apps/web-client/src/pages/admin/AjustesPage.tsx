/**
 * AjustesPage
 * Spec 006 (R-026, T-050)
 * Configuración global del sistema editorial, apariencia exclusiva del panel administrativo
 * y control de la bandera PUBLIC_ONLY_RATIFIED.
 * Restringido exclusivamente al rol super_admin.
 */

import { useEffect, useState } from 'react';
import {
  AdminBadge,
  AdminPageHeader,
  AdminSurface,
  AdminThemeTriStateSelector,
} from '@/components/admin/ui';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useAdmin';
import { PERMISSIONS } from '@/shared/permissions';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

const MISAK_IDENTITY_SWATCHES = [
  { hex: '#E52D6D', name: 'Magenta Misak', swatchClass: 'bg-[#E52D6D] border-black/15' },
  { hex: '#0055AA', name: 'Azul Misak', swatchClass: 'bg-[#0055AA] border-black/15' },
  { hex: '#FFFFFF', name: 'Blanco', swatchClass: 'bg-[#FFFFFF] border-black/30' },
  { hex: '#000000', name: 'Negro', swatchClass: 'bg-[#000000] border-white/30' },
] as const;

export function AjustesPage() {
  const { hasPermission } = useAuthStore();
  const { resolvedTheme } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';
  const canManageSettings = hasPermission(PERMISSIONS.AJUSTES_GESTIONAR);

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

  const successAlertClasses = isDark
    ? 'bg-emerald-950/80 text-emerald-100 border-emerald-500/50'
    : 'bg-emerald-50 text-emerald-900 border-emerald-600/40';

  const errorAlertClasses = isDark
    ? 'bg-red-950/80 text-red-100 border-red-500/50'
    : 'bg-red-50 text-red-900 border-red-600/40';

  if (!canManageSettings) {
    return (
      <div role="alert" className={cn('p-6 rounded-2xl border', errorAlertClasses)}>
        <h2 className="text-lg font-bold mb-1">Acceso Denegado</h2>
        <p className="text-sm">
          Esta sección de ajustes globales requiere el permiso{' '}
          <span className="font-mono font-semibold">settings:manage</span> (Spec 013 R-008).
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <AdminSurface
        variant="muted"
        className="py-12 text-center text-[var(--admin-text-secondary)]"
      >
        <output className="block">Cargando ajustes del sistema...</output>
      </AdminSurface>
    );
  }

  if (isError) {
    return (
      <div role="alert" className={cn('p-4 rounded-xl border text-sm', errorAlertClasses)}>
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
      <AdminPageHeader
        eyebrow="Configuración de Plataforma"
        title="Ajustes Globales del Sistema"
        description="Parámetros operativos, apariencia del entorno administrativo y políticas de visibilidad pública del léxico (R-026)."
      />

      {feedback && (
        <div
          role="alert"
          className={cn(
            'p-4 rounded-xl border text-sm font-medium',
            feedback.type === 'success' ? successAlertClasses : errorAlertClasses,
          )}
        >
          {feedback.text}
        </div>
      )}

      {/* Tarjeta 1: Apariencia del Panel Administrativo */}
      <AdminSurface className="p-6 space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-display font-bold text-[var(--admin-text)]">
              Apariencia del Panel Administrativo
            </h2>
            <AdminBadge tone="accent">Exclusivo /admin/*</AdminBadge>
          </div>
          <p className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
            El panel administrativo es el único espacio de la plataforma con gestión de modo claro y
            oscuro (iniciando en Modo Claro por defecto), armonizado con los 4 colores canónicos de
            la identidad Misak mientras el diccionario público conserva su lienzo oscuro curado.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {MISAK_IDENTITY_SWATCHES.map((swatch) => (
              <span
                key={swatch.hex}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[var(--admin-surface-muted)] text-[var(--admin-text)] border border-[var(--admin-border)]"
              >
                <span
                  aria-hidden="true"
                  className={cn('w-3 h-3 rounded-full border shrink-0', swatch.swatchClass)}
                />
                <span>{swatch.name}</span>
                <span className="text-[var(--admin-text-secondary)]">{swatch.hex}</span>
              </span>
            ))}
          </div>
        </div>

        <AdminThemeTriStateSelector />
      </AdminSurface>

      {/* Tarjeta 2: Políticas de Visibilidad Pública */}
      <AdminSurface className="overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-display font-bold text-[var(--admin-text)] mb-1">
              Políticas de Visibilidad Pública (R-026)
            </h2>
            <p className="text-sm text-[var(--admin-text-secondary)]">
              Controla cómo los visitantes y la comunidad consultan las entradas léxicas en la
              interfaz pública del diccionario.
            </p>
          </div>

          <div className="pt-4 border-t border-[var(--admin-border)] flex items-start justify-between gap-6">
            <div className="flex-1">
              <label
                htmlFor="toggle-public-only-ratified"
                className="text-base font-semibold text-[var(--admin-text)] block cursor-pointer"
              >
                Modo estricto: Solo entradas ratificadas (PUBLIC_ONLY_RATIFIED)
              </label>
              <p className="text-sm mt-1">
                {publicOnlyRatified ? (
                  <span
                    className={
                      isDark ? 'text-emerald-300 font-medium' : 'text-emerald-800 font-medium'
                    }
                  >
                    Activo: El diccionario público oculta completamente los borradores; solo las
                    palabras aprobadas formalmente son visibles.
                  </span>
                ) : (
                  <span className="text-[var(--admin-text-secondary)]">
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
              className={cn(
                'relative inline-flex h-11 w-[72px] min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 p-1.5 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055AA] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                publicOnlyRatified
                  ? 'bg-[#0055AA] border-[#0055AA]'
                  : 'bg-[var(--admin-surface-muted)] border-[var(--admin-control-border)]',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none inline-block h-7 w-7 transform rounded-full shadow-xs ring-0 transition duration-200 ease-in-out',
                  publicOnlyRatified
                    ? 'translate-x-7 bg-[#FFFFFF]'
                    : 'translate-x-0 bg-[var(--admin-text)]',
                )}
              />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-xs text-[var(--admin-text-secondary)] leading-relaxed">
          <span className="font-semibold text-[var(--admin-text)]">Nota de Gobierno:</span> Toda
          alteración a este parámetro queda registrada en el log inmutable de auditoría con el
          usuario responsable (R-019).
        </div>
      </AdminSurface>
    </div>
  );
}
