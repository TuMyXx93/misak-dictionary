/**
 * AdminMediaEditModal — Spec 014 (R-004, R-010)
 *
 * Modal accesible para editar metadatos culturales, propósito y vinculación léxica/taxonómica
 * de un medio existente sin re-subir el archivo binario. Si el medio estaba `ratificado`,
 * advierte al editor que el guardado lo devolverá a estado `borrador` (R-010).
 */

import { type FormEvent, useEffect, useState } from 'react';
import {
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from '@/components/admin/ui';
import { type AdminMediaItem, useUpdateAdminMediaMetadata } from '@/hooks/useAdmin';
import { MediaTaxonomyAndSentidoFields } from './MediaTaxonomyAndSentidoFields';
import { getPropositosByTipo } from './mediaCatalogHelpers';

export interface AdminMediaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: AdminMediaItem | null;
  onSuccess?: (updated: AdminMediaItem) => void;
}

export const AdminMediaEditModal = ({
  isOpen,
  onClose,
  media,
  onSuccess,
}: AdminMediaEditModalProps) => {
  const [proposito, setProposito] = useState('');
  const [hablanteAutor, setHablanteAutor] = useState('');
  const [varianteDialectal, setVarianteDialectal] = useState('');
  const [descripcionEspanol, setDescripcionEspanol] = useState('');
  const [descripcionNamtrik, setDescripcionNamtrik] = useState('');
  const [licenciaComunitaria, setLicenciaComunitaria] = useState('');
  const [sentidoId, setSentidoId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [campoSemanticoId, setCampoSemanticoId] = useState('');
  const [subcampoSemanticoId, setSubcampoSemanticoId] = useState('');
  const [microcampoId, setMicrocampoId] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const updateMutation = useUpdateAdminMediaMetadata();

  useEffect(() => {
    if (isOpen && media) {
      setProposito(media.proposito);
      setHablanteAutor(media.hablanteAutor ?? '');
      setVarianteDialectal(media.varianteDialectal ?? '');
      setDescripcionEspanol(media.descripcionEspanol ?? '');
      setDescripcionNamtrik(media.descripcionNamtrik ?? '');
      setLicenciaComunitaria(
        media.licenciaComunitaria || 'Propiedad Intelectual Colectiva del Pueblo Misak',
      );
      setSentidoId(media.sentidoId ?? '');
      setFormaId(media.formaId ?? '');
      setCampoSemanticoId(media.campoSemanticoId ?? '');
      setSubcampoSemanticoId(media.subcampoSemanticoId ?? '');
      setMicrocampoId(media.microcampoId ?? '');
      setErrorLocal(null);
    }
  }, [isOpen, media]);

  if (!media) return null;

  const propositosDisponibles = getPropositosByTipo(media.tipo);
  const streamUrl = `/api/media/${media.uuid}/stream`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    try {
      const res = await updateMutation.mutateAsync({
        id: media.id,
        data: {
          proposito,
          hablanteAutor: hablanteAutor.trim() || null,
          varianteDialectal: varianteDialectal.trim() || null,
          descripcionEspanol: descripcionEspanol.trim() || null,
          descripcionNamtrik: descripcionNamtrik.trim() || null,
          licenciaComunitaria: licenciaComunitaria.trim() || undefined,
          sentidoId: sentidoId || null,
          formaId: sentidoId && formaId ? formaId : null,
          campoSemanticoId: campoSemanticoId || null,
          subcampoSemanticoId: subcampoSemanticoId || null,
          microcampoId: microcampoId || null,
        },
      });
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      setErrorLocal(err instanceof Error ? err.message : 'Error al actualizar el medio cultural.');
    }
  };

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Metadatos del Medio"
      titleId="edit-media-title"
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {media.estado === 'ratificado' && (
          <div
            role="note"
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs font-medium text-amber-900 dark:text-amber-200"
          >
            Atención (R-010): Este medio cultural está <strong>ratificado</strong>. Al guardar
            cualquier modificación volverá a estado <strong>borrador</strong> y requerirá nueva
            ratificación (sin afectar el estado del sentido vinculado).
          </div>
        )}

        {errorLocal && (
          <div
            role="alert"
            className="p-3 text-sm rounded-xl bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 font-medium"
          >
            {errorLocal}
          </div>
        )}

        {/* Previsualización y descarga directa */}
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--admin-text)] truncate max-w-md">
              {media.originalName ?? media.filename}
            </span>
            <a
              href={`${streamUrl}?download=1`}
              download={media.originalName ?? media.filename}
              className="text-xs font-semibold text-[#0055AA] hover:underline"
            >
              Descargar archivo original
            </a>
          </div>
          {media.tipo === 'audio' ? (
            <audio
              controls
              preload="metadata"
              src={streamUrl}
              aria-label={`Reproducción de ${media.originalName ?? media.filename}`}
              className="w-full"
            >
              <track kind="captions" srcLang="es" label="Subtítulos en español" />
            </audio>
          ) : media.tipo === 'imagen' ? (
            <img
              src={streamUrl}
              alt={media.descripcionEspanol ?? media.originalName ?? media.filename}
              className="max-h-44 mx-auto rounded-lg object-contain"
            />
          ) : (
            <video
              controls
              preload="metadata"
              width={480}
              height={270}
              src={streamUrl}
              poster={media.posterUuid ? `/api/media/${media.posterUuid}/stream` : undefined}
              className="w-full max-h-52 rounded-lg bg-black"
            >
              <track kind="captions" srcLang="es" label="Subtítulos en español" />
            </video>
          )}
        </div>

        {/* Propósito */}
        <div>
          <AdminFieldLabel htmlFor="edit-media-proposito">Propósito Cultural</AdminFieldLabel>
          <AdminSelect
            id="edit-media-proposito"
            value={proposito}
            onChange={(e) => setProposito(e.target.value)}
          >
            {propositosDisponibles.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </AdminSelect>
        </div>

        {/* Vinculación léxica y taxonómica */}
        <MediaTaxonomyAndSentidoFields
          idPrefix="edit-media"
          isOpen={isOpen}
          sentidoId={sentidoId}
          onSentidoIdChange={setSentidoId}
          formaId={formaId}
          onFormaIdChange={setFormaId}
          campoSemanticoId={campoSemanticoId}
          onCampoSemanticoIdChange={setCampoSemanticoId}
          subcampoSemanticoId={subcampoSemanticoId}
          onSubcampoSemanticoIdChange={setSubcampoSemanticoId}
          microcampoId={microcampoId}
          onMicrocampoIdChange={setMicrocampoId}
          initialLinkedMedia={media}
          onApplySuggestedDescriptions={({
            descripcionNamtrik: sugNam,
            descripcionEspanol: sugEs,
          }) => {
            if (sugNam) setDescripcionNamtrik(sugNam);
            if (sugEs) setDescripcionEspanol(sugEs);
          }}
        />

        {/* Hablante / Variante */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <AdminFieldLabel htmlFor="edit-media-hablante">
              Hablante / Autor / Fotógrafo
            </AdminFieldLabel>
            <AdminInput
              id="edit-media-hablante"
              type="text"
              value={hablanteAutor}
              onChange={(e) => setHablanteAutor(e.target.value)}
            />
          </div>

          <div>
            <AdminFieldLabel htmlFor="edit-media-variante">Variante Dialectal</AdminFieldLabel>
            <AdminInput
              id="edit-media-variante"
              type="text"
              value={varianteDialectal}
              onChange={(e) => setVarianteDialectal(e.target.value)}
            />
          </div>
        </div>

        <div>
          <AdminFieldLabel htmlFor="edit-media-desc-es">Descripción en Español</AdminFieldLabel>
          <AdminTextarea
            id="edit-media-desc-es"
            rows={2}
            value={descripcionEspanol}
            onChange={(e) => setDescripcionEspanol(e.target.value)}
          />
        </div>

        <div>
          <AdminFieldLabel htmlFor="edit-media-desc-nam">
            Descripción / Glosa en Namtrik
          </AdminFieldLabel>
          <AdminTextarea
            id="edit-media-desc-nam"
            rows={2}
            value={descripcionNamtrik}
            onChange={(e) => setDescripcionNamtrik(e.target.value)}
          />
        </div>

        <div>
          <AdminFieldLabel htmlFor="edit-media-licencia">
            Licencia Comunitaria Misak
          </AdminFieldLabel>
          <AdminInput
            id="edit-media-licencia"
            type="text"
            value={licenciaComunitaria}
            onChange={(e) => setLicenciaComunitaria(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[var(--admin-border)]">
          <AdminButton
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </AdminButton>
          <AdminButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </AdminButton>
        </div>
      </form>
    </AdminDialog>
  );
};
