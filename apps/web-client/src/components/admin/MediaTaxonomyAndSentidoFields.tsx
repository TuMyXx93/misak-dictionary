/**
 * Campos reutilizables de vinculación léxica (Sentido / Forma) y taxonómica en cascada
 * para los modales de carga y edición de medios culturales (Spec 014 R-004).
 */

import { useMemo, useState } from 'react';
import { AdminButton, AdminFieldLabel, AdminInput, AdminSelect } from '@/components/admin/ui';
import {
  type AdminMediaItem,
  type AdminSentidoItem,
  useAdminMediaSentidoSearch,
  useAdminMediaTaxonomyCatalog,
} from '@/hooks/useAdmin';
import { flattenTaxonomyCatalog } from './mediaCatalogHelpers';

export interface MediaTaxonomyAndSentidoFieldsProps {
  idPrefix: string;
  isOpen: boolean;
  sentidoId: string;
  onSentidoIdChange: (id: string) => void;
  formaId: string;
  onFormaIdChange: (id: string) => void;
  campoSemanticoId: string;
  onCampoSemanticoIdChange: (id: string) => void;
  subcampoSemanticoId: string;
  onSubcampoSemanticoIdChange: (id: string) => void;
  microcampoId: string;
  onMicrocampoIdChange: (id: string) => void;
  fixedSentidoId?: string;
  fixedSentidoLema?: string;
  fixedSentidoGlosa?: string;
  fixedSentidoFormas?: Array<{
    id?: string;
    orden?: number;
    lema: string;
    variante?: string | null;
  }>;
  initialLinkedMedia?: AdminMediaItem | null;
  onApplySuggestedDescriptions?: (sugerencia: {
    descripcionNamtrik: string;
    descripcionEspanol: string;
  }) => void;
}

export const MediaTaxonomyAndSentidoFields = ({
  idPrefix,
  isOpen,
  sentidoId,
  onSentidoIdChange,
  formaId,
  onFormaIdChange,
  campoSemanticoId,
  onCampoSemanticoIdChange,
  subcampoSemanticoId,
  onSubcampoSemanticoIdChange,
  microcampoId,
  onMicrocampoIdChange,
  fixedSentidoId,
  fixedSentidoLema,
  fixedSentidoGlosa,
  fixedSentidoFormas,
  initialLinkedMedia,
  onApplySuggestedDescriptions,
}: MediaTaxonomyAndSentidoFieldsProps) => {
  const [sentidoSearchQuery, setSentidoSearchQuery] = useState('');

  const { data: sentidosCatalog = [] } = useAdminMediaSentidoSearch(
    sentidoSearchQuery,
    isOpen && !fixedSentidoId,
    25,
  );
  const { data: taxonomyTree = [] } = useAdminMediaTaxonomyCatalog(isOpen && !fixedSentidoId);

  const catalog = useMemo(() => flattenTaxonomyCatalog(taxonomyTree), [taxonomyTree]);

  const sentidosOptions = useMemo(() => {
    const list: AdminSentidoItem[] = [...sentidosCatalog];
    const existingSentido = initialLinkedMedia?.sentido;
    if (existingSentido && !list.some((s) => s.id === existingSentido.id)) {
      list.unshift({
        id: existingSentido.id,
        codigo: existingSentido.codigo,
        version: 1,
        tipo: existingSentido.tipo ?? 'estandar',
        estado: (existingSentido.estado as 'borrador' | 'ratificado') ?? 'borrador',
        espanolGlosa: existingSentido.espanolGlosa,
        updatedAt: '',
        formas: existingSentido.formas?.map((f) => ({
          id: f.id,
          orden: f.orden,
          lema: f.lema,
          variante: f.variante,
        })),
      });
    }
    return list;
  }, [sentidosCatalog, initialLinkedMedia]);

  const selectedSentido = useMemo(
    () => sentidosOptions.find((s) => s.id === sentidoId) ?? null,
    [sentidosOptions, sentidoId],
  );

  const availableFormas = useMemo(() => {
    if (fixedSentidoId) {
      return fixedSentidoFormas ?? [];
    }
    if (selectedSentido?.formas && selectedSentido.formas.length > 0) {
      return selectedSentido.formas;
    }
    if (initialLinkedMedia?.sentidoId === sentidoId && initialLinkedMedia.sentido?.formas) {
      return initialLinkedMedia.sentido.formas;
    }
    if (initialLinkedMedia?.forma && (!sentidoId || initialLinkedMedia.sentidoId === sentidoId)) {
      return [initialLinkedMedia.forma];
    }
    return [];
  }, [fixedSentidoId, fixedSentidoFormas, selectedSentido, initialLinkedMedia, sentidoId]);

  const filteredSubcampos = useMemo(() => {
    if (!campoSemanticoId) return catalog.subcampos;
    return catalog.subcampos.filter((s) => s.parentCampoId === campoSemanticoId);
  }, [catalog.subcampos, campoSemanticoId]);

  const filteredMicrocampos = useMemo(() => {
    if (subcampoSemanticoId) {
      return catalog.microcampos.filter((m) => m.parentSubcampoId === subcampoSemanticoId);
    }
    if (campoSemanticoId) {
      return catalog.microcampos.filter((m) => m.parentCampoId === campoSemanticoId);
    }
    return catalog.microcampos;
  }, [catalog.microcampos, subcampoSemanticoId, campoSemanticoId]);

  const handleCampoSelect = (nextCampoId: string) => {
    onCampoSemanticoIdChange(nextCampoId);
    if (
      subcampoSemanticoId &&
      nextCampoId &&
      !catalog.subcampos.some(
        (s) => s.id === subcampoSemanticoId && s.parentCampoId === nextCampoId,
      )
    ) {
      onSubcampoSemanticoIdChange('');
    }
    if (
      microcampoId &&
      nextCampoId &&
      !catalog.microcampos.some((m) => m.id === microcampoId && m.parentCampoId === nextCampoId)
    ) {
      onMicrocampoIdChange('');
    }
  };

  const handleSubcampoSelect = (nextSubcampoId: string) => {
    onSubcampoSemanticoIdChange(nextSubcampoId);
    const sub = catalog.subcampos.find((s) => s.id === nextSubcampoId);
    if (sub?.parentCampoId && sub.parentCampoId !== campoSemanticoId) {
      onCampoSemanticoIdChange(sub.parentCampoId);
    }
    if (
      microcampoId &&
      nextSubcampoId &&
      !catalog.microcampos.some(
        (m) => m.id === microcampoId && m.parentSubcampoId === nextSubcampoId,
      )
    ) {
      onMicrocampoIdChange('');
    }
  };

  const handleMicrocampoSelect = (nextMicroId: string) => {
    onMicrocampoIdChange(nextMicroId);
    const micro = catalog.microcampos.find((m) => m.id === nextMicroId);
    if (micro?.parentSubcampoId && micro.parentSubcampoId !== subcampoSemanticoId) {
      onSubcampoSemanticoIdChange(micro.parentSubcampoId);
    }
    if (micro?.parentCampoId && micro.parentCampoId !== campoSemanticoId) {
      onCampoSemanticoIdChange(micro.parentCampoId);
    }
  };

  const handleAutocompleteDescriptions = () => {
    if (!onApplySuggestedDescriptions) return;
    if (fixedSentidoId) {
      const targetForma = availableFormas.find((f) => f.id === formaId);
      onApplySuggestedDescriptions({
        descripcionNamtrik: targetForma?.lema ?? fixedSentidoLema ?? '',
        descripcionEspanol: fixedSentidoGlosa ?? '',
      });
      return;
    }

    if (!selectedSentido) return;
    const targetForma =
      selectedSentido.formas?.find((f) => f.id === formaId) ?? selectedSentido.formas?.[0];
    onApplySuggestedDescriptions({
      descripcionNamtrik: targetForma?.lema ?? selectedSentido.lema ?? selectedSentido.codigo,
      descripcionEspanol: selectedSentido.espanolGlosa ?? selectedSentido.glosa ?? '',
    });
  };

  if (fixedSentidoId) {
    return (
      <div className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--admin-text-secondary)]">
            Vinculando a:{' '}
            <span className="font-semibold text-[var(--admin-text)]">
              {fixedSentidoLema || `Sentido #${fixedSentidoId}`}
            </span>
          </p>
          {onApplySuggestedDescriptions && (fixedSentidoLema || fixedSentidoGlosa) && (
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAutocompleteDescriptions}
            >
              Autocompletar descripción
            </AdminButton>
          )}
        </div>

        {availableFormas.length > 0 && (
          <div>
            <AdminFieldLabel htmlFor={`${idPrefix}-forma-select`}>
              Forma o variante específica (opcional)
            </AdminFieldLabel>
            <AdminSelect
              id={`${idPrefix}-forma-select`}
              value={formaId}
              onChange={(e) => onFormaIdChange(e.target.value)}
            >
              <option value="">Todo el sentido léxico (lema principal)</option>
              {availableFormas
                .filter((f): f is { id: string; lema: string; variante?: string | null } =>
                  Boolean(f.id),
                )
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.lema}
                    {f.variante ? ` (${f.variante})` : ''}
                  </option>
                ))}
            </AdminSelect>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Vinculación léxica (Sentido y Forma) */}
      <fieldset className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 p-3.5 space-y-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
          Vinculación a Sentido Léxico / Forma (opcional)
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <AdminFieldLabel htmlFor={`${idPrefix}-sentido-search`}>
              Buscar sentido léxico
            </AdminFieldLabel>
            <AdminInput
              id={`${idPrefix}-sentido-search`}
              type="search"
              placeholder="Ej. Milu kalik, caracol o C4.S6.E021..."
              value={sentidoSearchQuery}
              onChange={(e) => setSentidoSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <AdminFieldLabel htmlFor={`${idPrefix}-sentido-select`}>
              Sentido léxico vinculado
            </AdminFieldLabel>
            <AdminSelect
              id={`${idPrefix}-sentido-select`}
              value={sentidoId}
              onChange={(e) => {
                onSentidoIdChange(e.target.value);
                onFormaIdChange('');
              }}
            >
              <option value="">Sin sentido léxico vinculado</option>
              {sentidosOptions.map((s) => {
                const lema = s.formas?.[0]?.lema ?? s.lema ?? s.codigo;
                const glosa = s.espanolGlosa ?? s.glosa ?? '';
                return (
                  <option key={s.id} value={s.id}>
                    {s.codigo} · {lema} {glosa ? `— ${glosa}` : ''}
                  </option>
                );
              })}
            </AdminSelect>
          </div>
        </div>

        {(sentidoId || availableFormas.length > 0) && (
          <div className="flex flex-wrap items-end gap-3">
            {availableFormas.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <AdminFieldLabel htmlFor={`${idPrefix}-forma-select`}>
                  Forma o variante (opcional)
                </AdminFieldLabel>
                <AdminSelect
                  id={`${idPrefix}-forma-select`}
                  value={formaId}
                  onChange={(e) => onFormaIdChange(e.target.value)}
                >
                  <option value="">Todo el sentido léxico</option>
                  {availableFormas
                    .filter((f): f is { id: string; lema: string; variante?: string | null } =>
                      Boolean(f.id),
                    )
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.lema}
                        {f.variante ? ` (${f.variante})` : ''}
                      </option>
                    ))}
                </AdminSelect>
              </div>
            )}

            {onApplySuggestedDescriptions && selectedSentido && (
              <AdminButton
                type="button"
                variant="secondary"
                size="md"
                onClick={handleAutocompleteDescriptions}
              >
                Autocompletar descripción
              </AdminButton>
            )}
          </div>
        )}
      </fieldset>

      {/* Vinculación taxonómica en cascada */}
      <details
        open={Boolean(campoSemanticoId || subcampoSemanticoId || microcampoId)}
        className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 px-4 py-3"
      >
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] select-none">
          Vinculación taxonómica opcional (Campo / Subcampo / Microcampo)
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div>
            <AdminFieldLabel htmlFor={`${idPrefix}-campo-select`}>Campo Semántico</AdminFieldLabel>
            <AdminSelect
              id={`${idPrefix}-campo-select`}
              value={campoSemanticoId}
              onChange={(e) => handleCampoSelect(e.target.value)}
            >
              <option value="">Sin campo</option>
              {catalog.campos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} · {c.espanolTermino || c.namtrikTermino}
                </option>
              ))}
            </AdminSelect>
          </div>

          <div>
            <AdminFieldLabel htmlFor={`${idPrefix}-subcampo-select`}>Subcampo</AdminFieldLabel>
            <AdminSelect
              id={`${idPrefix}-subcampo-select`}
              value={subcampoSemanticoId}
              onChange={(e) => handleSubcampoSelect(e.target.value)}
            >
              <option value="">Sin subcampo</option>
              {filteredSubcampos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo} · {s.espanolTermino || s.namtrikTermino}
                </option>
              ))}
            </AdminSelect>
          </div>

          <div>
            <AdminFieldLabel htmlFor={`${idPrefix}-microcampo-select`}>
              Microcampo / Subnivel
            </AdminFieldLabel>
            <AdminSelect
              id={`${idPrefix}-microcampo-select`}
              value={microcampoId}
              onChange={(e) => handleMicrocampoSelect(e.target.value)}
            >
              <option value="">Sin microcampo</option>
              {filteredMicrocampos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.depth > 0 ? `${'↳ '.repeat(m.depth)}` : ''}
                  {m.codigo} · {m.espanolTermino || m.namtrikTermino}
                </option>
              ))}
            </AdminSelect>
          </div>
        </div>
      </details>
    </div>
  );
};
