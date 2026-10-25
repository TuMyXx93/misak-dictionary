/**
 * SentidoEditorPage — Phase 4 · Spec 006 · Phase 5 · Spec 007
 *
 * Formulario para creación y edición de sentidos léxicos con soporte para:
 * - CampoNamtrik y control de versión optimista (R-007, Spec 006)
 * - Retorno a borrador (R-010, Spec 006) y resolución de 409
 * - Pestaña de Medios Culturales asociados con soporte de audio, imagen y video (R-014, Spec 007)
 */

import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminMediaUploadModal } from '@/components/admin/AdminMediaUploadModal';
import { CampoNamtrik } from '@/components/admin/CampoNamtrik';
import { ConflictoVersionDialog } from '@/components/admin/ConflictoVersionDialog';
import {
  AdminBadge,
  AdminButton,
  AdminFieldLabel,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  AdminSurface,
  AdminTextarea,
} from '@/components/admin/ui';
import { AudioPlayButton } from '@/components/ui/AudioPlayButton';
import {
  type CulturalMediaItem,
  CulturalMediaLightbox,
} from '@/components/ui/CulturalMediaLightbox';
import { LazyImage } from '@/components/ui/LazyImage';
import {
  type AdminMediaItem,
  useAdminMediaList,
  useAdminSentido,
  useCreateSentido,
  useDeleteAdminMedia,
  useRatifyAdminMedia,
  useUpdateSentido,
} from '@/hooks/useAdmin';
import { AdminApiError } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';

type AdminLightboxMediaItem = CulturalMediaItem & {
  tipo?: 'imagen' | 'video';
  duracionSegundos?: number | null;
  posterSrc?: string | null;
};

function formatMediaBytes(sizeBytes: string | number, forceMb = false): string {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0) return forceMb ? '0.0 MB' : '0.0 kB';
  const kb = bytes / 1024;
  if (forceMb || kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb.toFixed(1)} kB`;
}

function formatDurationLabel(seconds?: number | null): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const rounded = Math.round(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function SentidoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'nuevo');
  const navigate = useNavigate();

  const { hasPermission } = useAuthStore();
  const canWriteMedia = hasPermission('media:write');
  const canDeleteMedia = hasPermission('media:delete');

  const { data: sentido, isLoading, refetch } = useAdminSentido(isEditing ? id : undefined);
  const createMutation = useCreateSentido();
  const updateMutation = useUpdateSentido();

  // Pestañas (R-014, T-037)
  const [activeTab, setActiveTab] = useState<'lexico' | 'medios'>('lexico');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<AdminLightboxMediaItem | null>(null);

  // Consulta de medios vinculados
  const { data: mediaData, refetch: refetchMedia } = useAdminMediaList(
    isEditing && id ? { sentidoId: id } : {},
  );
  const deleteMediaMutation = useDeleteAdminMedia();
  const ratifyMediaMutation = useRatifyAdminMedia();

  // Campos de formulario léxico
  const [codigo, setCodigo] = useState('');
  const [lema, setLema] = useState('');
  const [glosa, setGlosa] = useState('');
  const [categoriaGramatical, setCategoriaGramatical] = useState('sustantivo');
  const [tipo, setTipo] = useState<'termino' | 'variante' | 'ejemplo'>('termino');
  const [ejemploNamtrik, setEjemploNamtrik] = useState('');
  const [ejemploEspanol, setEjemploEspanol] = useState('');
  const [nodoCodigo, setNodoCodigo] = useState('');
  const [localVersion, setLocalVersion] = useState<number>(1);

  // Estados de conflicto y errores
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [serverConflictData, setServerConflictData] = useState<{
    version?: number;
    lema?: string;
    glosa?: string;
  }>({});

  // Cargar datos en modo edición
  useEffect(() => {
    if (sentido) {
      setCodigo(sentido.codigo);
      setLema(sentido.lema ?? '');
      setGlosa(sentido.glosa ?? '');
      if (sentido.categoriaGramatical) setCategoriaGramatical(sentido.categoriaGramatical);
      if (sentido.tipo) setTipo(sentido.tipo as 'termino' | 'variante' | 'ejemplo');
      setNodoCodigo(sentido.nodo?.codigo ?? '');
      setLocalVersion(sentido.version);
    }
  }, [sentido]);

  const handleSubmit = async (e?: FormEvent, forceVersion?: number) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const versionToUse = forceVersion ?? localVersion;

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({
          id,
          lema,
          glosa,
          categoriaGramatical,
          tipo,
          version: versionToUse,
        });
      } else {
        await createMutation.mutateAsync({
          codigo,
          lema,
          glosa,
          categoriaGramatical,
          tipo,
          nodoCodigo,
        });
      }
      navigate('/admin/sentidos');
    } catch (err: unknown) {
      if (err instanceof AdminApiError && err.statusCode === 409) {
        const details = err.details as
          | {
              serverVersion?: number;
              serverData?: { lema?: string; glosa?: string };
            }
          | undefined;

        setServerConflictData({
          version: details?.serverVersion ?? versionToUse + 1,
          lema: details?.serverData?.lema,
          glosa: details?.serverData?.glosa,
        });
        setConflictDialogOpen(true);
      } else {
        const msg = err instanceof Error ? err.message : 'Error al guardar el sentido.';
        setErrorMessage(msg);
      }
    }
  };

  const handleReloadServer = async () => {
    setConflictDialogOpen(false);
    const { data } = await refetch();
    if (data) {
      setLema(data.lema ?? '');
      setGlosa(data.glosa ?? '');
      setLocalVersion(data.version);
    }
  };

  const handleOverwrite = async () => {
    setConflictDialogOpen(false);
    const nextVer = serverConflictData.version ?? localVersion + 1;
    setLocalVersion(nextVer);
    await handleSubmit(undefined, nextVer);
  };

  const handlePreviewImage = (item: AdminMediaItem) => {
    setLightboxMedia({
      src: `/api/media/${item.uuid}/stream`,
      alt: item.descripcionEspanol ?? item.filename,
      tipo: 'imagen',
      descripcionEspanol: item.descripcionEspanol,
      descripcionNamtrik: item.descripcionNamtrik,
      autor: item.hablanteAutor,
      variante: item.varianteDialectal,
      licencia: item.licenciaComunitaria,
      anchoPx: item.anchoPx,
      altoPx: item.altoPx,
    });
  };

  const handlePreviewVideo = (item: AdminMediaItem) => {
    setLightboxMedia({
      src: `/api/media/${item.uuid}/stream`,
      alt: item.descripcionEspanol ?? item.filename,
      tipo: 'video',
      descripcionEspanol: item.descripcionEspanol,
      descripcionNamtrik: item.descripcionNamtrik,
      autor: item.hablanteAutor,
      variante: item.varianteDialectal,
      licencia: item.licenciaComunitaria,
      anchoPx: item.anchoPx,
      altoPx: item.altoPx,
      duracionSegundos: item.duracionSegundos,
      posterSrc: item.posterUuid ? `/api/media/${item.posterUuid}/stream` : null,
    });
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (window.confirm('¿Desea eliminar este medio cultural del sentido?')) {
      await deleteMediaMutation.mutateAsync(mediaId);
      refetchMedia();
    }
  };

  const handleRatifyMedia = async (mediaId: string) => {
    await ratifyMediaMutation.mutateAsync(mediaId);
    refetchMedia();
  };

  if (isEditing && isLoading) {
    return (
      <AdminSurface className="py-12 px-4 text-center text-[var(--admin-text-secondary)]">
        <div role="status">Cargando datos del sentido...</div>
      </AdminSurface>
    );
  }

  const isRatificado = sentido?.estado === 'ratificado';
  const mediaItems = mediaData?.items ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabecera */}
      <AdminPageHeader
        eyebrow="Edición Léxica"
        title={isEditing ? `Editar sentido (${sentido?.codigo ?? ''})` : 'Nuevo sentido léxico'}
        description={
          isEditing
            ? `Versión actual: v${localVersion} (R-007)`
            : 'Registrar nueva entrada léxica en la taxonomía'
        }
        actions={
          <Link
            to="/admin/sentidos"
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold text-[var(--admin-text)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] border border-[var(--admin-control-border)] rounded-xl transition-colors"
          >
            Volver a la lista
          </Link>
        }
      />

      {isRatificado && (
        <div
          role="region"
          aria-label="Aviso de retorno a borrador"
          className="p-4 bg-amber-500/15 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 text-sm rounded-r-2xl"
        >
          <span className="font-bold">Atención:</span> Este sentido se encuentra actualmente
          ratificado. Al guardar cualquier modificación volverá automáticamente a estado{' '}
          <span className="font-bold">borrador</span> y requerirá nueva ratificación editorial
          (R-010).
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-500/15 border border-red-600/35 text-red-800 dark:text-red-300 text-sm font-medium rounded-2xl"
        >
          {errorMessage}
        </div>
      )}

      {/* Pestañas (Spec 007 R-014, T-037) */}
      {isEditing && (
        <div
          role="tablist"
          aria-label="Pestañas de edición"
          className="flex border-b border-[var(--admin-border)] gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'lexico'}
            onClick={() => setActiveTab('lexico')}
            className={`min-h-[48px] px-4 py-2 border-b-2 text-sm transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'lexico'
                ? 'border-[#E52D6D] text-[var(--admin-text)] font-bold'
                : 'border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] font-medium'
            }`}
          >
            <span>Datos Léxicos</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'medios'}
            onClick={() => setActiveTab('medios')}
            className={`min-h-[48px] px-4 py-2 border-b-2 text-sm transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'medios'
                ? 'border-[#E52D6D] text-[var(--admin-text)] font-bold'
                : 'border-transparent text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] font-medium'
            }`}
          >
            <span>Medios Culturales</span>
            <AdminBadge tone="accent">{mediaItems.length}</AdminBadge>
          </button>
        </div>
      )}

      {/* Pestaña 1: Datos Léxicos */}
      {activeTab === 'lexico' && (
        <AdminSurface className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Código del sentido */}
            <div>
              <AdminFieldLabel htmlFor="sentido-codigo">
                Código del sentido {!isEditing && <span className="text-[#E52D6D]">*</span>}
              </AdminFieldLabel>
              <AdminInput
                id="sentido-codigo"
                type="text"
                required={!isEditing}
                disabled={isEditing}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="ej: C1.S1.M21.SENT.1"
              />
              {isEditing && (
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                  El código del sentido es inmutable tras su creación.
                </p>
              )}
            </div>

            {/* Lema en Namtrik con teclado virtual */}
            <div>
              <AdminFieldLabel htmlFor="sentido-lema">
                Lema (Namtrik) <span className="text-[#E52D6D]">*</span>
              </AdminFieldLabel>
              <CampoNamtrik
                id="sentido-lema"
                required
                value={lema}
                onChange={setLema}
                placeholder="Término en lengua Namtrik..."
                className="mt-1"
              />
            </div>

            {/* Glosa en español */}
            <div>
              <AdminFieldLabel htmlFor="sentido-glosa">
                Glosa / Definición (Castellano) <span className="text-[#E52D6D]">*</span>
              </AdminFieldLabel>
              <AdminInput
                id="sentido-glosa"
                type="text"
                required
                value={glosa}
                onChange={(e) => setGlosa(e.target.value)}
                placeholder="Significado o traducción directa..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Categoría gramatical */}
              <div>
                <AdminFieldLabel htmlFor="sentido-categoria">Categoría Gramatical</AdminFieldLabel>
                <AdminSelect
                  id="sentido-categoria"
                  value={categoriaGramatical}
                  onChange={(e) => setCategoriaGramatical(e.target.value)}
                >
                  <option value="sustantivo">Sustantivo</option>
                  <option value="verbo">Verbo</option>
                  <option value="adjetivo">Adjetivo</option>
                  <option value="adverbio">Adverbio</option>
                  <option value="pronombre">Pronombre</option>
                  <option value="interjeccion">Interjección</option>
                  <option value="particula">Partícula</option>
                </AdminSelect>
              </div>

              {/* Tipo de sentido */}
              <div>
                <AdminFieldLabel htmlFor="sentido-tipo">Tipo de Entrada</AdminFieldLabel>
                <AdminSelect
                  id="sentido-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'termino' | 'variante' | 'ejemplo')}
                >
                  <option value="termino">Término estándar</option>
                  <option value="variante">Variante dialectal</option>
                  <option value="ejemplo">Ejemplo de uso</option>
                </AdminSelect>
              </div>
            </div>

            {/* Microcampo / Nodo contenedor */}
            {!isEditing && (
              <div>
                <AdminFieldLabel htmlFor="sentido-nodo">
                  Código del nodo microcampo <span className="text-[#E52D6D]">*</span>
                </AdminFieldLabel>
                <AdminInput
                  id="sentido-nodo"
                  type="text"
                  required
                  value={nodoCodigo}
                  onChange={(e) => setNodoCodigo(e.target.value)}
                  placeholder="ej: C1.S1.M21"
                />
              </div>
            )}

            {/* Ejemplos contextuales */}
            <div className="space-y-4 pt-4 border-t border-[var(--admin-border)]">
              <h3 className="text-sm font-bold text-[var(--admin-text)] uppercase tracking-wider">
                Contexto de uso
              </h3>
              <div>
                <AdminFieldLabel htmlFor="ejemplo-namtrik">
                  Oración de Ejemplo (Namtrik)
                </AdminFieldLabel>
                <CampoNamtrik
                  id="ejemplo-namtrik"
                  value={ejemploNamtrik}
                  onChange={setEjemploNamtrik}
                  placeholder="Frase o uso tradicional en Namtrik..."
                  className="mt-1"
                />
              </div>
              <div>
                <AdminFieldLabel htmlFor="ejemplo-espanol">
                  Traducción del Ejemplo (Español)
                </AdminFieldLabel>
                <AdminTextarea
                  id="ejemplo-espanol"
                  rows={2}
                  value={ejemploEspanol}
                  onChange={(e) => setEjemploEspanol(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--admin-border)] flex flex-wrap justify-end gap-3">
              <Link
                to="/admin/sentidos"
                className="px-4 py-2.5 min-h-[48px] inline-flex items-center justify-center border border-[var(--admin-control-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] rounded-xl text-sm font-semibold text-[var(--admin-text)] transition-colors"
              >
                Cancelar
              </Link>
              <AdminButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Crear sentido'}
              </AdminButton>
            </div>
          </form>
        </AdminSurface>
      )}

      {/* Pestaña 2: Medios Culturales (R-014, T-037) */}
      {isEditing && activeTab === 'medios' && (
        <AdminSurface className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold font-display text-[var(--admin-text)]">
                Medios Culturales Vinculados
              </h2>
              <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
                Audios de pronunciación, ilustraciones y videos culturales asociados a este sentido
                léxico.
              </p>
            </div>
            {canWriteMedia && (
              <AdminButton variant="accent" size="md" onClick={() => setIsMediaModalOpen(true)}>
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Agregar medio</span>
              </AdminButton>
            )}
          </div>

          {mediaItems.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-[var(--admin-border)] rounded-2xl text-[var(--admin-text-secondary)] bg-[var(--admin-surface-muted)]/30">
              <svg
                aria-hidden="true"
                className="w-10 h-10 mx-auto text-[var(--admin-text-muted)] mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <p className="text-sm font-semibold text-[var(--admin-text)]">
                Este sentido aún no tiene medios culturales asociados.
              </p>
              <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                Puedes enriquecerlo cargando pronunciaciones en Namtrik, ilustraciones o videos
                culturales.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--admin-border)]">
              {mediaItems.map((item) => {
                const durationLabel = formatDurationLabel(item.duracionSegundos);
                return (
                  <div
                    key={item.id}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {item.tipo === 'audio' ? (
                        <AudioPlayButton
                          trackId={item.uuid}
                          audioUrl={`/api/media/${item.uuid}/stream`}
                          lema={lema || sentido?.codigo || ''}
                        />
                      ) : item.tipo === 'video' ? (
                        <button
                          type="button"
                          onClick={() => handlePreviewVideo(item)}
                          aria-label={`Ver video ${item.descripcionEspanol ?? item.filename}`}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--admin-control-border)] bg-black shrink-0 flex items-center justify-center group hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D] cursor-pointer"
                        >
                          {item.posterUuid && (
                            <img
                              src={`/api/media/${item.posterUuid}/stream`}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                            />
                          )}
                          <span className="relative z-10 w-8 h-8 rounded-full bg-[#E52D6D] text-white flex items-center justify-center shadow-md">
                            <svg
                              aria-hidden="true"
                              className="w-4 h-4 ml-0.5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePreviewImage(item)}
                          aria-label={`Ver imagen ${item.descripcionEspanol ?? item.filename}`}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-[var(--admin-control-border)] shrink-0 hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055AA] cursor-pointer"
                        >
                          <LazyImage
                            src={`/api/media/${item.uuid}/stream`}
                            alt={item.descripcionEspanol ?? item.filename}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.tipo === 'audio' ? (
                            <AdminBadge tone="primary">Audio</AdminBadge>
                          ) : item.tipo === 'video' ? (
                            <AdminBadge tone="accent">Video</AdminBadge>
                          ) : (
                            <AdminBadge tone="success">Imagen</AdminBadge>
                          )}
                          <span className="text-xs font-medium text-[var(--admin-text-secondary)] capitalize">
                            {item.proposito.replace(/_/g, ' ')}
                          </span>
                          {item.estado === 'ratificado' ? (
                            <AdminBadge tone="success">Ratificado</AdminBadge>
                          ) : (
                            <AdminBadge tone="warning">En revisión</AdminBadge>
                          )}
                        </div>

                        {item.descripcionNamtrik && (
                          <p
                            className="text-xs text-[var(--admin-text)] font-medium italic mt-1"
                            lang="gum"
                          >
                            «{item.descripcionNamtrik}»
                          </p>
                        )}
                        {item.descripcionEspanol && (
                          <p className="text-xs text-[var(--admin-text-secondary)]">
                            {item.descripcionEspanol}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--admin-text-muted)] mt-1">
                          {item.hablanteAutor && <span>Autor: {item.hablanteAutor}</span>}
                          {item.varianteDialectal && (
                            <span>Variante: {item.varianteDialectal}</span>
                          )}
                          <span>{formatMediaBytes(item.sizeBytes, item.tipo === 'video')}</span>
                          {durationLabel && <span>Duración: {durationLabel}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {canWriteMedia && item.estado === 'borrador' && (
                        <AdminButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleRatifyMedia(item.id)}
                          disabled={ratifyMediaMutation.isPending}
                        >
                          Ratificar
                        </AdminButton>
                      )}

                      {canDeleteMedia && (
                        <AdminButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteMedia(item.id)}
                          disabled={deleteMediaMutation.isPending}
                        >
                          Eliminar
                        </AdminButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal de Carga vinculado al sentido */}
          <AdminMediaUploadModal
            isOpen={isMediaModalOpen}
            onClose={() => setIsMediaModalOpen(false)}
            sentidoId={id}
            sentidoLema={lema || sentido?.codigo}
            onSuccess={() => refetchMedia()}
          />

          {/* Modal de Previsualización Lightbox */}
          <CulturalMediaLightbox
            isOpen={Boolean(lightboxMedia)}
            onClose={() => setLightboxMedia(null)}
            media={lightboxMedia}
          />
        </AdminSurface>
      )}

      {/* Diálogo de conflicto de versión (R-007) */}
      <ConflictoVersionDialog
        isOpen={conflictDialogOpen}
        serverVersion={serverConflictData.version}
        serverData={{
          lema: serverConflictData.lema,
          glosa: serverConflictData.glosa,
        }}
        onReloadServer={handleReloadServer}
        onOverwrite={handleOverwrite}
        onCancel={() => setConflictDialogOpen(false)}
      />
    </div>
  );
}
