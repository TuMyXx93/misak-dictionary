/**
 * SentidoEditorPage — Spec 006 · Spec 007 · Spec 012 v0.2.0
 *
 * Formulario profesional y robusto para creación y edición de sentidos léxicos con soporte para:
 * - Multiforma léxica y variantes dialectales (formas[], V. 1..3, acepciones homónimas, neologismos)
 * - Catálogo dinámico de abreviaturas gramaticales con creación in-situ («+ Nueva abreviatura»)
 * - Sección dedicada de taxonomía biológica / botánica / zoológica (Nombre Científico)
 * - Estructura dialógica completa (preguntas/respuestas en Namtrik y glosas)
 * - CampoNamtrik y control de versión optimista (R-007, Spec 006)
 * - Retorno a borrador (R-010, Spec 006) y resolución de 409
 * - Pestaña de Medios Culturales asociados con soporte de audio, imagen y video (R-014, Spec 007)
 */

import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminAbreviaturasModal } from '@/components/admin/AdminAbreviaturasModal';
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
  useAdminAbreviaturas,
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

interface FormaItemState {
  id?: string;
  orden: number;
  lema: string;
  categoriaGramatical: string;
  variante: string;
  acepcionHomonima: string;
  esNeologismo: boolean;
}

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

  const { data: abreviaturas } = useAdminAbreviaturas();

  const [activeTab, setActiveTab] = useState<'lexico' | 'medios'>('lexico');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<AdminLightboxMediaItem | null>(null);

  const { data: mediaData, refetch: refetchMedia } = useAdminMediaList(
    isEditing && id ? { sentidoId: id } : {},
  );
  const deleteMediaMutation = useDeleteAdminMedia();
  const ratifyMediaMutation = useRatifyAdminMedia();

  const [codigo, setCodigo] = useState('');
  const [nodoCodigo, setNodoCodigo] = useState('');
  const [localVersion, setLocalVersion] = useState<number>(1);
  const [tipo, setTipo] = useState<'estandar' | 'dialogico'>('estandar');

  const [formas, setFormas] = useState<FormaItemState[]>([
    {
      orden: 1,
      lema: '',
      categoriaGramatical: 's.',
      variante: '',
      acepcionHomonima: '',
      esNeologismo: false,
    },
  ]);

  const [glosa, setGlosa] = useState('');
  const [explicacion, setExplicacion] = useState('');
  const [namtrikContexto, setNamtrikContexto] = useState('');
  const [nombreCientifico, setNombreCientifico] = useState('');
  const [observacionEditorial, setObservacionEditorial] = useState('');

  const [respuestaNamtrik, setRespuestaNamtrik] = useState('');
  const [respuestaNamtrikContexto, setRespuestaNamtrikContexto] = useState('');
  const [respuestaEspanolGlosa, setRespuestaEspanolGlosa] = useState('');
  const [respuestaEspanolExplicacion, setRespuestaEspanolExplicacion] = useState('');

  const [isNewAbrevOpen, setIsNewAbrevOpen] = useState(false);
  const [newAbrevTargetIndex, setNewAbrevTargetIndex] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [serverConflictData, setServerConflictData] = useState<{
    version?: number;
    lema?: string;
    glosa?: string;
  }>({});

  useEffect(() => {
    if (sentido) {
      setCodigo(sentido.codigo);
      setGlosa(sentido.glosa ?? sentido.espanolGlosa ?? '');
      setExplicacion(sentido.espanolExplicacion ?? '');
      setNamtrikContexto(sentido.namtrikContexto ?? '');
      setNombreCientifico(sentido.nombreCientifico ?? '');
      setObservacionEditorial(sentido.observacionEditorial ?? '');
      setTipo(sentido.tipo === 'dialogico' ? 'dialogico' : 'estandar');
      setRespuestaNamtrik(sentido.respuestaNamtrik ?? '');
      setRespuestaNamtrikContexto(sentido.respuestaNamtrikContexto ?? '');
      setRespuestaEspanolGlosa(sentido.respuestaEspanolGlosa ?? '');
      setRespuestaEspanolExplicacion(sentido.respuestaEspanolExplicacion ?? '');
      setNodoCodigo(sentido.nodo?.codigo ?? '');
      setLocalVersion(sentido.version);

      if (sentido.formas && sentido.formas.length > 0) {
        setFormas(
          sentido.formas.map((f, i) => ({
            id: f.id,
            orden: f.orden ?? i + 1,
            lema: f.lema ?? '',
            categoriaGramatical: f.categoriaGramatical ?? 's.',
            variante: f.variante ?? '',
            acepcionHomonima: f.acepcionHomonima != null ? String(f.acepcionHomonima) : '',
            esNeologismo: Boolean(f.esNeologismo),
          })),
        );
      } else {
        setFormas([
          {
            orden: 1,
            lema: sentido.lema ?? '',
            categoriaGramatical: sentido.categoriaGramatical ?? 's.',
            variante: '',
            acepcionHomonima: '',
            esNeologismo: false,
          },
        ]);
      }
    }
  }, [sentido]);

  const updateForma = (index: number, patch: Partial<FormaItemState>) => {
    setFormas((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addForma = () => {
    setFormas((prev) => [
      ...prev,
      {
        orden: prev.length + 1,
        lema: '',
        categoriaGramatical: 's.',
        variante: `V. ${prev.length + 1}`,
        acepcionHomonima: '',
        esNeologismo: false,
      },
    ]);
  };

  const removeForma = (index: number) => {
    if (formas.length <= 1) return;
    setFormas((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, orden: i + 1 })));
  };

  const openNewAbrevModal = (targetIndex: number) => {
    setNewAbrevTargetIndex(targetIndex);
    setIsNewAbrevOpen(true);
  };

  const handleSubmit = async (e?: FormEvent, forceVersion?: number) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const versionToUse = forceVersion ?? localVersion;

    const formasPayload = formas.map((f, i) => ({
      id: f.id,
      orden: i + 1,
      lema: f.lema,
      categoriaGramatical: f.categoriaGramatical || null,
      variante: f.variante || null,
      acepcionHomonima: f.acepcionHomonima ? parseInt(f.acepcionHomonima, 10) : null,
      esNeologismo: f.esNeologismo,
    }));

    const firstForma = formas[0] ?? { lema: '', categoriaGramatical: 's.' };

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({
          id,
          lema: firstForma.lema,
          glosa,
          categoriaGramatical: firstForma.categoriaGramatical,
          tipo,
          version: versionToUse,
          formas: formasPayload,
          espanolGlosa: glosa,
          espanolExplicacion: explicacion || null,
          namtrikContexto: namtrikContexto || null,
          nombreCientifico: nombreCientifico || null,
          observacionEditorial: observacionEditorial || null,
          respuestaNamtrik: tipo === 'dialogico' ? respuestaNamtrik || null : null,
          respuestaNamtrikContexto: tipo === 'dialogico' ? respuestaNamtrikContexto || null : null,
          respuestaEspanolGlosa: tipo === 'dialogico' ? respuestaEspanolGlosa || null : null,
          respuestaEspanolExplicacion:
            tipo === 'dialogico' ? respuestaEspanolExplicacion || null : null,
        });
      } else {
        await createMutation.mutateAsync({
          codigo,
          nodoCodigo,
          ubicacion: { nivel: 'microcampo', id: nodoCodigo },
          lema: firstForma.lema,
          glosa,
          categoriaGramatical: firstForma.categoriaGramatical,
          tipo,
          formas: formasPayload,
          espanolGlosa: glosa,
          espanolExplicacion: explicacion || null,
          namtrikContexto: namtrikContexto || null,
          nombreCientifico: nombreCientifico || null,
          observacionEditorial: observacionEditorial || null,
          respuestaNamtrik: tipo === 'dialogico' ? respuestaNamtrik || null : null,
          respuestaNamtrikContexto: tipo === 'dialogico' ? respuestaNamtrikContexto || null : null,
          respuestaEspanolGlosa: tipo === 'dialogico' ? respuestaEspanolGlosa || null : null,
          respuestaEspanolExplicacion:
            tipo === 'dialogico' ? respuestaEspanolExplicacion || null : null,
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
      setLocalVersion(data.version);
      setGlosa(data.glosa ?? data.espanolGlosa ?? '');
      setExplicacion(data.espanolExplicacion ?? '');
      setNombreCientifico(data.nombreCientifico ?? '');
      if (data.formas && data.formas.length > 0) {
        setFormas(
          data.formas.map((f, i) => ({
            id: f.id,
            orden: f.orden ?? i + 1,
            lema: f.lema ?? '',
            categoriaGramatical: f.categoriaGramatical ?? 's.',
            variante: f.variante ?? '',
            acepcionHomonima: f.acepcionHomonima != null ? String(f.acepcionHomonima) : '',
            esNeologismo: Boolean(f.esNeologismo),
          })),
        );
      }
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
        <output className="block">Cargando datos del sentido...</output>
      </AdminSurface>
    );
  }

  const isRatificado = sentido?.estado === 'ratificado';
  const mediaItems = mediaData?.items ?? [];
  const primaryLema = formas[0]?.lema ?? '';

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
        <section
          aria-label="Aviso de retorno a borrador"
          className="p-4 bg-amber-500/15 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 text-sm rounded-r-2xl"
        >
          <span className="font-bold">Atención:</span> Este sentido se encuentra actualmente
          ratificado. Al guardar cualquier modificación volverá automáticamente a estado{' '}
          <span className="font-bold">borrador</span> y requerirá nueva ratificación editorial
          (R-010).
        </section>
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Identificación y Taxonomía */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] border-b border-[var(--admin-border)] pb-2">
                1. Ubicación y Código
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    placeholder="ej: C1.S1.M5.E001"
                  />
                  {isEditing && (
                    <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                      Inmutable tras su creación.
                    </p>
                  )}
                </div>

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
                      placeholder="ej: C1.S1.M5"
                    />
                  </div>
                )}

                <div>
                  <AdminFieldLabel htmlFor="sentido-tipo">Tipo de Entrada</AdminFieldLabel>
                  <AdminSelect
                    id="sentido-tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as 'estandar' | 'dialogico')}
                  >
                    <option value="estandar">Estándar</option>
                    <option value="dialogico">Dialógico (Pregunta/Respuesta)</option>
                  </AdminSelect>
                </div>
              </div>
            </div>

            {/* 2. Formas Léxicas y Variantes (Multiforma) */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-2">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
                    2. Formas Léxicas y Variantes (Namtrik)
                  </h2>
                  <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
                    Permite registrar múltiples variantes dialectales, acepciones homónimas y
                    neologismos.
                  </p>
                </div>
                <AdminButton type="button" variant="secondary" size="sm" onClick={addForma}>
                  + Añadir forma / variante
                </AdminButton>
              </div>

              <div className="space-y-4">
                {formas.map((forma, idx) => (
                  <div
                    key={forma.id ?? `forma-${forma.orden}`}
                    className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/40 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[var(--admin-primary-text)]">
                        Forma #{idx + 1}{' '}
                        {idx === 0 ? '(Principal)' : `— ${forma.variante || 'Variante'}`}
                      </span>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => removeForma(idx)}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          Eliminar forma
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lema en Namtrik */}
                      <div>
                        <AdminFieldLabel
                          htmlFor={idx === 0 ? 'sentido-lema' : `sentido-lema-${idx}`}
                        >
                          Lema (Namtrik) <span className="text-[#E52D6D]">*</span>
                        </AdminFieldLabel>
                        <CampoNamtrik
                          id={idx === 0 ? 'sentido-lema' : `sentido-lema-${idx}`}
                          required={idx === 0}
                          value={forma.lema}
                          onChange={(val) => updateForma(idx, { lema: val })}
                          placeholder="Término en lengua Namtrik..."
                          className="mt-1"
                        />
                      </div>

                      {/* Categoría Gramatical con botón de gestión CRUD de abreviaturas */}
                      <div>
                        <div className="flex items-center justify-between">
                          <AdminFieldLabel
                            htmlFor={idx === 0 ? 'sentido-categoria' : `sentido-categoria-${idx}`}
                          >
                            Categoría Gramatical
                          </AdminFieldLabel>
                          <button
                            type="button"
                            onClick={() => openNewAbrevModal(idx)}
                            className="text-xs text-[#0055AA] dark:text-[#5599EE] hover:underline font-semibold cursor-pointer"
                          >
                            + Nueva / Gestionar abreviaturas
                          </button>
                        </div>
                        <AdminSelect
                          id={idx === 0 ? 'sentido-categoria' : `sentido-categoria-${idx}`}
                          value={forma.categoriaGramatical}
                          onChange={(e) =>
                            updateForma(idx, { categoriaGramatical: e.target.value })
                          }
                        >
                          {abreviaturas?.map((abrev) => (
                            <option key={abrev.id} value={abrev.codigo}>
                              {abrev.codigo} — {abrev.etiquetaCompleta}
                            </option>
                          ))}
                        </AdminSelect>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <AdminFieldLabel htmlFor={`sentido-variante-${idx}`}>
                          Variante Dialectal / Nota
                        </AdminFieldLabel>
                        <AdminInput
                          id={`sentido-variante-${idx}`}
                          type="text"
                          value={forma.variante}
                          onChange={(e) => updateForma(idx, { variante: e.target.value })}
                          placeholder="ej: V. 1, Occidental, etc."
                        />
                      </div>

                      <div>
                        <AdminFieldLabel htmlFor={`sentido-homonima-${idx}`}>
                          Acepción Homónima (N°)
                        </AdminFieldLabel>
                        <AdminInput
                          id={`sentido-homonima-${idx}`}
                          type="number"
                          min="1"
                          value={forma.acepcionHomonima}
                          onChange={(e) => updateForma(idx, { acepcionHomonima: e.target.value })}
                          placeholder="ej: 1, 2"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          id={`sentido-neologismo-${idx}`}
                          type="checkbox"
                          checked={forma.esNeologismo}
                          onChange={(e) => updateForma(idx, { esNeologismo: e.target.checked })}
                          className="h-4 w-4 rounded border-[var(--admin-control-border)] text-[#E52D6D] focus:ring-[#E52D6D]"
                        />
                        <label
                          htmlFor={`sentido-neologismo-${idx}`}
                          className="text-xs font-semibold text-[var(--admin-text)] cursor-pointer"
                        >
                          ¿Es neologismo comunitario?
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Definición, Glosa y Contexto */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] border-b border-[var(--admin-border)] pb-2">
                3. Glosa y Definición (Castellano)
              </h2>

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
                  placeholder="Significado o traducción directa en castellano..."
                />
              </div>

              <div>
                <AdminFieldLabel htmlFor="sentido-explicacion">
                  Explicación Cultural Extendida (Castellano)
                </AdminFieldLabel>
                <AdminTextarea
                  id="sentido-explicacion"
                  rows={3}
                  value={explicacion}
                  onChange={(e) => setExplicacion(e.target.value)}
                  placeholder="Detalles sobre el significado ancestral, cultural, cosmogónico o de práctica comunitaria..."
                />
              </div>

              <div>
                <AdminFieldLabel htmlFor="sentido-contexto-namtrik">
                  Descripción Semántica / Contexto (Namtrik)
                </AdminFieldLabel>
                <CampoNamtrik
                  id="sentido-contexto-namtrik"
                  value={namtrikContexto}
                  onChange={setNamtrikContexto}
                  placeholder="Descripción o contexto de uso en Namtrik..."
                  className="mt-1"
                />
              </div>
            </div>

            {/* 4. Taxonomía Biológica / Botánica / Zoológica (Nombre Científico) */}
            <div className="space-y-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  🌿🔬
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  4. Taxonomía Biológica (Nombre Científico)
                </h2>
              </div>
              <p className="text-xs text-[var(--admin-text-secondary)]">
                Si el término corresponde a una planta, animal, hongo o especie biológica, registre
                su denominación científica en latín. Este campo se indexa de inmediato en el
                buscador público global.
              </p>
              <div>
                <AdminFieldLabel htmlFor="sentido-cientifico">
                  Nombre Científico (Latín)
                </AdminFieldLabel>
                <AdminInput
                  id="sentido-cientifico"
                  type="text"
                  value={nombreCientifico}
                  onChange={(e) => setNombreCientifico(e.target.value)}
                  placeholder="ej: Passiflora tripartita, Tapirus pinchaque, Gastropoda..."
                  className="font-serif italic"
                />
              </div>
            </div>

            {/* 5. Entrada Dialógica (si tipo === 'dialogico') */}
            {tipo === 'dialogico' && (
              <div className="space-y-4 p-4 rounded-xl border border-[#0055AA]/30 bg-[#0055AA]/5">
                <div className="flex items-center gap-2">
                  <span className="text-[#0055AA] dark:text-[#5599EE] font-bold text-sm">💬</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#0055AA] dark:text-[#5599EE]">
                    5. Estructura Dialógica (Pregunta / Respuesta)
                  </h2>
                </div>
                <p className="text-xs text-[var(--admin-text-secondary)]">
                  Estructura conversacional tradicional: registre la respuesta habitual o fórmula
                  ritual correspondiente.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <AdminFieldLabel htmlFor="sentido-respuesta-namtrik">
                      Respuesta en Namtrik
                    </AdminFieldLabel>
                    <CampoNamtrik
                      id="sentido-respuesta-namtrik"
                      value={respuestaNamtrik}
                      onChange={setRespuestaNamtrik}
                      placeholder="Fórmula de respuesta en Namtrik..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <AdminFieldLabel htmlFor="sentido-respuesta-glosa">
                      Glosa de la Respuesta (Castellano)
                    </AdminFieldLabel>
                    <AdminInput
                      id="sentido-respuesta-glosa"
                      type="text"
                      value={respuestaEspanolGlosa}
                      onChange={(e) => setRespuestaEspanolGlosa(e.target.value)}
                      placeholder="Traducción al castellano de la respuesta..."
                    />
                  </div>
                </div>

                <div>
                  <AdminFieldLabel htmlFor="sentido-respuesta-contexto-namtrik">
                    Contexto de la Respuesta (Namtrik)
                  </AdminFieldLabel>
                  <CampoNamtrik
                    id="sentido-respuesta-contexto-namtrik"
                    value={respuestaNamtrikContexto}
                    onChange={setRespuestaNamtrikContexto}
                    placeholder="Contexto en que se emite la respuesta..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <AdminFieldLabel htmlFor="sentido-respuesta-explicacion">
                    Explicación de la Respuesta (Castellano)
                  </AdminFieldLabel>
                  <AdminTextarea
                    id="sentido-respuesta-explicacion"
                    rows={2}
                    value={respuestaEspanolExplicacion}
                    onChange={(e) => setRespuestaEspanolExplicacion(e.target.value)}
                    placeholder="Significado cultural de la respuesta..."
                  />
                </div>
              </div>
            )}

            {/* 6. Observaciones Editoriales */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] border-b border-[var(--admin-border)] pb-2">
                6. Observaciones Editoriales Internas
              </h2>

              <div>
                <AdminFieldLabel htmlFor="sentido-observacion">
                  Notas de Trabajo / Consejo Lingüístico
                </AdminFieldLabel>
                <AdminTextarea
                  id="sentido-observacion"
                  rows={2}
                  value={observacionEditorial}
                  onChange={(e) => setObservacionEditorial(e.target.value)}
                  placeholder="Aclaraciones metodológicas, fuentes orales, debates del comité..."
                />
              </div>
            </div>

            {/* Acciones del formulario */}
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
                          lema={primaryLema || sentido?.codigo || ''}
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
                            className="text-xs text-[var(--admin-text)] font-medium mt-1"
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
            sentidoLema={primaryLema || sentido?.codigo}
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

      {/* Modal accesible para creación, edición y eliminación de abreviaturas gramaticales */}
      <AdminAbreviaturasModal
        isOpen={isNewAbrevOpen}
        onClose={() => {
          setIsNewAbrevOpen(false);
          setNewAbrevTargetIndex(null);
        }}
        onSelectAbreviatura={(codigoSeleccionado) => {
          if (newAbrevTargetIndex !== null) {
            updateForma(newAbrevTargetIndex, { categoriaGramatical: codigoSeleccionado });
          }
        }}
      />
    </div>
  );
}
