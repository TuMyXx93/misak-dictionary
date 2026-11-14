/**
 * AdminMediaUploadModal — Spec 007 + Spec 014 (Medios Escalonados + Ecosistema Bidireccional)
 *
 * Modal accesible para la carga y catalogación de medios culturales (R-014):
 * - Soporta audios (MP3, OGG, WAV, WebM — máx 10 MB), ilustraciones (WebP, JPEG, PNG, SVG — máx 10 MB)
 *   y videos culturales (MP4, WebM, OGG — máx 100 MB).
 * - Vista previa instantánea en cliente (ObjectURL) con liberación automática de memoria.
 * - Vinculación a sentidos léxicos, formas/variantes o árbol taxonómico en cascada (sin IDs numéricos crudos).
 * - Catalogación cultural con propósito, hablante/autor, variante y licencia colectiva.
 */

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import {
  AdminButton,
  AdminDialog,
  AdminFieldLabel,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from '@/components/admin/ui';
import { type AdminMediaItem, type AdminMediaTipo, useUploadAdminMedia } from '@/hooks/useAdmin';
import { MediaTaxonomyAndSentidoFields } from './MediaTaxonomyAndSentidoFields';
import { ACCEPT_BY_TIPO, formatSelectedFileSize, getPropositosByTipo } from './mediaCatalogHelpers';

export interface AdminMediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentidoId?: string;
  formaId?: string;
  campoSemanticoId?: string;
  subcampoSemanticoId?: string;
  microcampoId?: string;
  sentidoLema?: string;
  sentidoGlosa?: string;
  sentidoFormas?: Array<{
    id?: string;
    orden?: number;
    lema: string;
    variante?: string | null;
  }>;
  onSuccess?: (nuevoMedio: AdminMediaItem) => void;
}

interface TechnicalMediaMetadata {
  duracionSegundos?: number;
  anchoPx?: number;
  altoPx?: number;
}

const MAX_STANDARD_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const AdminMediaUploadModal = ({
  isOpen,
  onClose,
  sentidoId,
  formaId,
  campoSemanticoId,
  subcampoSemanticoId,
  microcampoId,
  sentidoLema,
  sentidoGlosa,
  sentidoFormas,
  onSuccess,
}: AdminMediaUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tipo, setTipo] = useState<AdminMediaTipo>('audio');
  const [proposito, setProposito] = useState<string>('pronunciacion_lema');
  const [hablanteAutor, setHablanteAutor] = useState('');
  const [varianteDialectal, setVarianteDialectal] = useState('');
  const [descripcionEspanol, setDescripcionEspanol] = useState('');
  const [descripcionNamtrik, setDescripcionNamtrik] = useState('');
  const [licenciaComunitaria, setLicenciaComunitaria] = useState(
    'Propiedad Intelectual Colectiva del Pueblo Misak',
  );
  const [selectedSentidoId, setSelectedSentidoId] = useState(sentidoId ?? '');
  const [selectedFormaId, setSelectedFormaId] = useState(formaId ?? '');
  const [campoIdInput, setCampoIdInput] = useState(campoSemanticoId ?? '');
  const [subcampoIdInput, setSubcampoIdInput] = useState(subcampoSemanticoId ?? '');
  const [microcampoIdInput, setMicrocampoIdInput] = useState(microcampoId ?? '');
  const [techMeta, setTechMeta] = useState<TechnicalMediaMetadata>({});
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const probeTokenRef = useRef(0);
  const uploadMutation = useUploadAdminMedia();

  // Generar y liberar ObjectURL para vista previa instantánea del archivo seleccionado
  useEffect(() => {
    if (!file || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      if (typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignorar errores en entornos sintéticos
        }
      }
    };
  }, [file]);

  // Reset del formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      probeTokenRef.current += 1;
      setFile(null);
      setPreviewUrl(null);
      setTipo('audio');
      setProposito('pronunciacion_lema');
      setHablanteAutor('');
      setVarianteDialectal('');
      setDescripcionEspanol('');
      setDescripcionNamtrik('');
      setLicenciaComunitaria('Propiedad Intelectual Colectiva del Pueblo Misak');
      setSelectedSentidoId(sentidoId ?? '');
      setSelectedFormaId(formaId ?? '');
      setCampoIdInput(campoSemanticoId ?? '');
      setSubcampoIdInput(subcampoSemanticoId ?? '');
      setMicrocampoIdInput(microcampoId ?? '');
      setTechMeta({});
      setErrorLocal(null);
    }
  }, [isOpen, sentidoId, formaId, campoSemanticoId, subcampoSemanticoId, microcampoId]);

  const probeClientMediaMetadata = (selectedFile: File, detectedTipo: AdminMediaTipo) => {
    probeTokenRef.current += 1;
    const currentToken = probeTokenRef.current;
    setTechMeta({});

    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return;
    }

    let objectUrl: string | null = null;
    const revokeSafe = () => {
      if (objectUrl && typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignorar fallos de revocación en entornos sintéticos
        }
        objectUrl = null;
      }
    };

    try {
      objectUrl = URL.createObjectURL(selectedFile);
      if (!objectUrl) return;

      if (detectedTipo === 'imagen') {
        const img = new Image();
        img.onload = () => {
          if (probeTokenRef.current === currentToken) {
            setTechMeta({
              anchoPx: img.naturalWidth > 0 ? img.naturalWidth : undefined,
              altoPx: img.naturalHeight > 0 ? img.naturalHeight : undefined,
            });
          }
          revokeSafe();
        };
        img.onerror = () => revokeSafe();
        img.src = objectUrl;
      } else if (detectedTipo === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          if (probeTokenRef.current === currentToken) {
            const rawDuration = video.duration;
            setTechMeta({
              duracionSegundos:
                Number.isFinite(rawDuration) && rawDuration > 0
                  ? Math.max(1, Math.round(rawDuration))
                  : undefined,
              anchoPx: video.videoWidth > 0 ? video.videoWidth : undefined,
              altoPx: video.videoHeight > 0 ? video.videoHeight : undefined,
            });
          }
          revokeSafe();
        };
        video.onerror = () => revokeSafe();
        video.src = objectUrl;
      } else {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          if (probeTokenRef.current === currentToken) {
            const rawDuration = audio.duration;
            setTechMeta({
              duracionSegundos:
                Number.isFinite(rawDuration) && rawDuration > 0
                  ? Math.max(1, Math.round(rawDuration))
                  : undefined,
            });
          }
          revokeSafe();
        };
        audio.onerror = () => revokeSafe();
        audio.src = objectUrl;
      }
    } catch {
      revokeSafe();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorLocal(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setTechMeta({});
      return;
    }

    const isExplicitAudioOrImage =
      selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('image/');
    const isVideoSelection =
      selectedFile.type.startsWith('video/') || (!isExplicitAudioOrImage && tipo === 'video');

    if (isVideoSelection) {
      setTipo('video');
      const videoPropositos = getPropositosByTipo('video');
      setProposito((prev) =>
        videoPropositos.some((p) => p.value === prev) ? prev : 'registro_practica_cultural',
      );
      if (selectedFile.size > MAX_VIDEO_BYTES) {
        setErrorLocal('El video seleccionado supera el límite máximo permitido de 100 MB.');
        setFile(null);
        setTechMeta({});
        return;
      }
      setFile(selectedFile);
      probeClientMediaMetadata(selectedFile, 'video');
      return;
    }

    if (selectedFile.size > MAX_STANDARD_BYTES) {
      setErrorLocal('El archivo seleccionado supera el límite máximo permitido de 10 MB.');
      setFile(null);
      setTechMeta({});
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      setTipo('imagen');
      setProposito('ilustracion_cultural');
      probeClientMediaMetadata(selectedFile, 'imagen');
    } else if (selectedFile.type.startsWith('audio/')) {
      setTipo('audio');
      setProposito('pronunciacion_lema');
      probeClientMediaMetadata(selectedFile, 'audio');
    } else {
      probeClientMediaMetadata(selectedFile, tipo);
    }
  };

  const handleTipoChange = (newTipo: AdminMediaTipo) => {
    setErrorLocal(null);
    setTipo(newTipo);
    if (newTipo === 'audio') {
      setProposito('pronunciacion_lema');
      if (file && file.size > MAX_STANDARD_BYTES) {
        setFile(null);
        setTechMeta({});
      }
    } else if (newTipo === 'imagen') {
      setProposito('ilustracion_cultural');
      if (file && file.size > MAX_STANDARD_BYTES) {
        setFile(null);
        setTechMeta({});
      }
    } else {
      setProposito('registro_practica_cultural');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!file) {
      setErrorLocal('Debe seleccionar un archivo para cargar.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    formData.append('proposito', proposito);

    const effectiveSentidoId = sentidoId ?? selectedSentidoId;
    const effectiveFormaId = selectedFormaId || formaId;
    if (effectiveSentidoId) formData.append('sentidoId', effectiveSentidoId);
    if (effectiveFormaId) formData.append('formaId', effectiveFormaId);
    if (campoIdInput.trim()) formData.append('campoSemanticoId', campoIdInput.trim());
    if (subcampoIdInput.trim()) formData.append('subcampoSemanticoId', subcampoIdInput.trim());
    if (microcampoIdInput.trim()) formData.append('microcampoId', microcampoIdInput.trim());

    if (hablanteAutor.trim()) formData.append('hablanteAutor', hablanteAutor.trim());
    if (varianteDialectal.trim()) formData.append('varianteDialectal', varianteDialectal.trim());
    if (descripcionEspanol.trim()) formData.append('descripcionEspanol', descripcionEspanol.trim());
    if (descripcionNamtrik.trim()) formData.append('descripcionNamtrik', descripcionNamtrik.trim());
    if (licenciaComunitaria.trim()) {
      formData.append('licenciaComunitaria', licenciaComunitaria.trim());
    }

    if (
      typeof techMeta.duracionSegundos === 'number' &&
      Number.isFinite(techMeta.duracionSegundos) &&
      techMeta.duracionSegundos > 0
    ) {
      formData.append('duracionSegundos', String(Math.round(techMeta.duracionSegundos)));
    }
    if (
      typeof techMeta.anchoPx === 'number' &&
      Number.isFinite(techMeta.anchoPx) &&
      techMeta.anchoPx > 0
    ) {
      formData.append('anchoPx', String(Math.round(techMeta.anchoPx)));
    }
    if (
      typeof techMeta.altoPx === 'number' &&
      Number.isFinite(techMeta.altoPx) &&
      techMeta.altoPx > 0
    ) {
      formData.append('altoPx', String(Math.round(techMeta.altoPx)));
    }

    try {
      const response = await uploadMutation.mutateAsync(formData);
      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (err) {
      setErrorLocal(
        err instanceof Error ? err.message : 'Error al subir el archivo multimedia al servidor',
      );
    }
  };

  const propositosDisponibles = getPropositosByTipo(tipo);

  return (
    <AdminDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Cargar Medio Cultural"
      titleId="upload-media-title"
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorLocal && (
          <div
            role="alert"
            className="p-3 text-sm rounded-xl bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 font-medium"
          >
            {errorLocal}
          </div>
        )}

        {/* Selección de Tipo (3 opciones con tap target >= 48px) */}
        <fieldset className="border-0 p-0 m-0">
          <legend className="block text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] mb-2">
            Tipo de Medio Cultural
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              aria-pressed={tipo === 'audio'}
              onClick={() => handleTipoChange('audio')}
              className={`min-h-[48px] px-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
                tipo === 'audio'
                  ? 'border-[#0055AA] bg-[var(--admin-primary-soft)] text-[var(--admin-primary-text)] ring-2 ring-[#0055AA]/30'
                  : 'border-[var(--admin-control-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] text-[var(--admin-text-secondary)]'
              }`}
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <span>Audio (Pronunciación)</span>
            </button>

            <button
              type="button"
              aria-pressed={tipo === 'imagen'}
              onClick={() => handleTipoChange('imagen')}
              className={`min-h-[48px] px-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
                tipo === 'imagen'
                  ? 'border-[#0055AA] bg-[var(--admin-primary-soft)] text-[var(--admin-primary-text)] ring-2 ring-[#0055AA]/30'
                  : 'border-[var(--admin-control-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] text-[var(--admin-text-secondary)]'
              }`}
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Ilustración / Imagen</span>
            </button>

            <button
              type="button"
              aria-pressed={tipo === 'video'}
              onClick={() => handleTipoChange('video')}
              className={`min-h-[48px] px-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
                tipo === 'video'
                  ? 'border-[#E52D6D] bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)] ring-2 ring-[#E52D6D]/30'
                  : 'border-[var(--admin-control-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] text-[var(--admin-text-secondary)]'
              }`}
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Video Cultural</span>
            </button>
          </div>
        </fieldset>

        {/* Archivo + Vista previa inmediata */}
        <div>
          <AdminFieldLabel htmlFor="media-file-input">
            Archivo binario (Máx {tipo === 'video' ? '100 MB' : '10 MB'}){' '}
            <span className="text-[#E52D6D]">*</span>
          </AdminFieldLabel>
          <input
            id="media-file-input"
            type="file"
            accept={ACCEPT_BY_TIPO[tipo]}
            onChange={handleFileChange}
            className="block w-full text-sm text-[var(--admin-text-secondary)] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#0055AA] file:text-white hover:file:bg-[#004488] cursor-pointer border border-[var(--admin-control-border)] rounded-xl p-2 bg-[var(--admin-input-bg)]"
          />
          {file && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-[var(--admin-text-secondary)]">
                Seleccionado:{' '}
                <span className="font-semibold text-[var(--admin-text)]">{file.name}</span> (
                {formatSelectedFileSize(file.size)})
              </p>

              {previewUrl && (
                <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)] mb-2">
                    Vista previa local
                  </p>
                  {tipo === 'audio' ? (
                    <audio
                      controls
                      preload="metadata"
                      src={previewUrl}
                      aria-label={`Vista previa de audio ${file.name}`}
                      className="w-full"
                    >
                      <track kind="captions" srcLang="es" label="Subtítulos en español" />
                    </audio>
                  ) : tipo === 'imagen' ? (
                    <img
                      src={previewUrl}
                      alt={`Vista previa de ${file.name}`}
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                  ) : (
                    <video
                      controls
                      preload="metadata"
                      width={480}
                      height={270}
                      src={previewUrl}
                      aria-label={`Vista previa de video ${file.name}`}
                      className="w-full max-h-56 rounded-lg bg-black"
                    >
                      <track kind="captions" srcLang="es" label="Subtítulos en español" />
                    </video>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vinculación léxica y taxonómica en cascada */}
        <MediaTaxonomyAndSentidoFields
          idPrefix="upload-media"
          isOpen={isOpen}
          sentidoId={selectedSentidoId}
          onSentidoIdChange={setSelectedSentidoId}
          formaId={selectedFormaId}
          onFormaIdChange={setSelectedFormaId}
          campoSemanticoId={campoIdInput}
          onCampoSemanticoIdChange={setCampoIdInput}
          subcampoSemanticoId={subcampoIdInput}
          onSubcampoSemanticoIdChange={setSubcampoIdInput}
          microcampoId={microcampoIdInput}
          onMicrocampoIdChange={setMicrocampoIdInput}
          fixedSentidoId={sentidoId}
          fixedSentidoLema={sentidoLema}
          fixedSentidoGlosa={sentidoGlosa}
          fixedSentidoFormas={sentidoFormas}
          onApplySuggestedDescriptions={({
            descripcionNamtrik: sugNam,
            descripcionEspanol: sugEs,
          }) => {
            if (sugNam) setDescripcionNamtrik(sugNam);
            if (sugEs) setDescripcionEspanol(sugEs);
          }}
        />

        {/* Propósito */}
        <div>
          <AdminFieldLabel htmlFor="proposito-select">
            Propósito Cultural <span className="text-[#E52D6D]">*</span>
          </AdminFieldLabel>
          <AdminSelect
            id="proposito-select"
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

        {/* Hablante / Fotógrafo / Autor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <AdminFieldLabel htmlFor="hablante-autor-input">
              Hablante / Autor / Fotógrafo
            </AdminFieldLabel>
            <AdminInput
              id="hablante-autor-input"
              type="text"
              placeholder="Ej. Taita Lorenzo Muelas"
              value={hablanteAutor}
              onChange={(e) => setHablanteAutor(e.target.value)}
            />
          </div>

          <div>
            <AdminFieldLabel htmlFor="variante-dialectal-input">Variante Dialectal</AdminFieldLabel>
            <AdminInput
              id="variante-dialectal-input"
              type="text"
              placeholder="Ej. Guambía Central, Piscitau"
              value={varianteDialectal}
              onChange={(e) => setVarianteDialectal(e.target.value)}
            />
          </div>
        </div>

        {/* Descripciones */}
        <div>
          <AdminFieldLabel htmlFor="desc-espanol-input">Descripción en Español</AdminFieldLabel>
          <AdminTextarea
            id="desc-espanol-input"
            rows={2}
            placeholder="Explicación contextual del recurso..."
            value={descripcionEspanol}
            onChange={(e) => setDescripcionEspanol(e.target.value)}
          />
        </div>

        <div>
          <AdminFieldLabel htmlFor="desc-namtrik-input">
            Descripción / Glosa en Namtrik
          </AdminFieldLabel>
          <AdminTextarea
            id="desc-namtrik-input"
            rows={2}
            placeholder="Namtrik wan wam..."
            value={descripcionNamtrik}
            onChange={(e) => setDescripcionNamtrik(e.target.value)}
          />
        </div>

        {/* Licencia */}
        <div>
          <AdminFieldLabel htmlFor="licencia-input">Licencia Comunitaria Misak</AdminFieldLabel>
          <AdminInput
            id="licencia-input"
            type="text"
            value={licenciaComunitaria}
            onChange={(e) => setLicenciaComunitaria(e.target.value)}
          />
        </div>

        {/* Botones de acción (tap target >= 48px) */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[var(--admin-border)]">
          <AdminButton
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={uploadMutation.isPending}
          >
            Cancelar
          </AdminButton>
          <AdminButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={uploadMutation.isPending || !file}
          >
            {uploadMutation.isPending ? (
              <>
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Subiendo recurso...</span>
              </>
            ) : (
              <span>Subir Medio Cultural</span>
            )}
          </AdminButton>
        </div>
      </form>
    </AdminDialog>
  );
};
