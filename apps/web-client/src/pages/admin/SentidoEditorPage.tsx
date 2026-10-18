/**
 * SentidoEditorPage — Phase 4 · Spec 006 · Phase 5 · Spec 007
 *
 * Formulario para creación y edición de sentidos léxicos con soporte para:
 * - CampoNamtrik y control de versión optimista (R-007, Spec 006)
 * - Retorno a borrador (R-010, Spec 006) y resolución de 409
 * - Pestaña de Medios Culturales asociados (R-014, Spec 007, T-037)
 */

import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminMediaUploadModal } from '@/components/admin/AdminMediaUploadModal';
import { CampoNamtrik } from '@/components/admin/CampoNamtrik';
import { ConflictoVersionDialog } from '@/components/admin/ConflictoVersionDialog';
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
  const [lightboxMedia, setLightboxMedia] = useState<CulturalMediaItem | null>(null);

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
      setLema(sentido.lema);
      setGlosa(sentido.glosa);
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
      setLema(data.lema);
      setGlosa(data.glosa);
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
      descripcionEspanol: item.descripcionEspanol,
      descripcionNamtrik: item.descripcionNamtrik,
      autor: item.hablanteAutor,
      variante: item.varianteDialectal,
      licencia: item.licenciaComunitaria,
      anchoPx: item.anchoPx,
      altoPx: item.altoPx,
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
      <div className="py-12 text-center text-slate-500" role="status">
        Cargando datos del sentido...
      </div>
    );
  }

  const isRatificado = sentido?.estado === 'ratificado';
  const mediaItems = mediaData?.items ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            {isEditing ? `Editar sentido (${sentido?.codigo ?? ''})` : 'Nuevo sentido léxico'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isEditing
              ? `Versión actual: v${localVersion} (R-007)`
              : 'Registrar nueva entrada léxica en la taxonomía'}
          </p>
        </div>
        <Link
          to="/admin/sentidos"
          className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl"
        >
          Volver a la lista
        </Link>
      </div>

      {isRatificado && (
        <div
          role="region"
          aria-label="Aviso de retorno a borrador"
          className="p-4 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 text-sm rounded-r-xl"
        >
          <span className="font-semibold">Atención:</span> Este sentido se encuentra actualmente
          ratificado. Al guardar cualquier modificación volverá automáticamente a estado{' '}
          <span className="font-semibold">borrador</span> y requerirá nueva ratificación editorial
          (R-010).
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm rounded-xl"
        >
          {errorMessage}
        </div>
      )}

      {/* Pestañas (Spec 007 R-014, T-037) */}
      {isEditing && (
        <div
          role="tablist"
          aria-label="Pestañas de edición"
          className="flex border-b border-slate-200 dark:border-slate-800 gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'lexico'}
            onClick={() => setActiveTab('lexico')}
            className={`min-h-[48px] px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'lexico'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Datos Léxicos</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'medios'}
            onClick={() => setActiveTab('medios')}
            className={`min-h-[48px] px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'medios'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Medios Culturales</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
              {mediaItems.length}
            </span>
          </button>
        </div>
      )}

      {/* Pestaña 1: Datos Léxicos */}
      {activeTab === 'lexico' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
        >
          {/* Código del sentido */}
          <div>
            <label
              htmlFor="sentido-codigo"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Código del sentido {!isEditing && <span className="text-rose-500">*</span>}
            </label>
            <input
              id="sentido-codigo"
              type="text"
              required={!isEditing}
              disabled={isEditing}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="ej: C1.S1.M21.SENT.1"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
            />
            {isEditing && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                El código del sentido es inmutable tras su creación.
              </p>
            )}
          </div>

          {/* Lema en Namtrik con teclado virtual */}
          <div>
            <label
              htmlFor="sentido-lema"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Lema (Namtrik) <span className="text-rose-500">*</span>
            </label>
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
            <label
              htmlFor="sentido-glosa"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Glosa / Definición (Castellano) <span className="text-rose-500">*</span>
            </label>
            <input
              id="sentido-glosa"
              type="text"
              required
              value={glosa}
              onChange={(e) => setGlosa(e.target.value)}
              placeholder="Significado o traducción directa..."
              className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categoría gramatical */}
            <div>
              <label
                htmlFor="sentido-categoria"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Categoría Gramatical
              </label>
              <select
                id="sentido-categoria"
                value={categoriaGramatical}
                onChange={(e) => setCategoriaGramatical(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary"
              >
                <option value="sustantivo">Sustantivo</option>
                <option value="verbo">Verbo</option>
                <option value="adjetivo">Adjetivo</option>
                <option value="adverbio">Adverbio</option>
                <option value="pronombre">Pronombre</option>
                <option value="interjeccion">Interjección</option>
                <option value="particula">Partícula</option>
              </select>
            </div>

            {/* Tipo de sentido */}
            <div>
              <label
                htmlFor="sentido-tipo"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Tipo de Entrada
              </label>
              <select
                id="sentido-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'termino' | 'variante' | 'ejemplo')}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary"
              >
                <option value="termino">Término estándar</option>
                <option value="variante">Variante dialectal</option>
                <option value="ejemplo">Ejemplo de uso</option>
              </select>
            </div>
          </div>

          {/* Microcampo / Nodo contenedor */}
          {!isEditing && (
            <div>
              <label
                htmlFor="sentido-nodo"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Código del nodo microcampo <span className="text-rose-500">*</span>
              </label>
              <input
                id="sentido-nodo"
                type="text"
                required
                value={nodoCodigo}
                onChange={(e) => setNodoCodigo(e.target.value)}
                placeholder="ej: C1.S1.M21"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary"
              />
            </div>
          )}

          {/* Ejemplos contextuales */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Contexto de uso
            </h3>
            <div>
              <label
                htmlFor="ejemplo-namtrik"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Oración de Ejemplo (Namtrik)
              </label>
              <CampoNamtrik
                id="ejemplo-namtrik"
                value={ejemploNamtrik}
                onChange={setEjemploNamtrik}
                placeholder="Frase o uso tradicional en Namtrik..."
                className="mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="ejemplo-espanol"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Traducción del Ejemplo (Español)
              </label>
              <textarea
                id="ejemplo-espanol"
                rows={2}
                value={ejemploEspanol}
                onChange={(e) => setEjemploEspanol(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Link
              to="/admin/sentidos"
              className="px-4 py-2 min-h-[48px] inline-flex items-center justify-center border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 min-h-[48px] bg-primary hover:bg-primary-light text-slate-900 font-semibold rounded-xl text-sm shadow-sm focus:outline-hidden focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear sentido'}
            </button>
          </div>
        </form>
      )}

      {/* Pestaña 2: Medios Culturales (R-014, T-037) */}
      {isEditing && activeTab === 'medios' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-slate-100">
                Medios Culturales Vinculados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audios de pronunciación e ilustraciones asociados a este sentido léxico.
              </p>
            </div>
            {canWriteMedia && (
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-sm font-semibold bg-primary hover:bg-primary-light text-slate-900 transition-all shadow-xs"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
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
                <span>+ Agregar medio</span>
              </button>
            )}
          </div>

          {mediaItems.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500">
              <svg
                aria-hidden="true"
                className="w-10 h-10 mx-auto text-slate-400 mb-2"
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
              <p className="text-sm font-medium">
                Este sentido aún no tiene medios culturales asociados.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Puedes enriquecerlo cargando pronunciaciones en Namtrik o ilustraciones culturales.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {item.tipo === 'audio' ? (
                      <AudioPlayButton
                        trackId={item.uuid}
                        audioUrl={`/api/media/${item.uuid}/stream`}
                        lema={lema || sentido?.codigo || ''}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePreviewImage(item)}
                        aria-label={`Ver imagen ${item.descripcionEspanol ?? item.filename}`}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 hover:scale-105 transition-all focus:outline-hidden focus:ring-2 focus:ring-primary"
                      >
                        <LazyImage
                          src={`/api/media/${item.uuid}/stream`}
                          alt={item.descripcionEspanol ?? item.filename}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.tipo === 'audio'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.tipo === 'audio' ? 'Audio' : 'Imagen'}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                          {item.proposito.replace(/_/g, ' ')}
                        </span>
                        {item.estado === 'ratificado' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Ratificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            En revisión
                          </span>
                        )}
                      </div>

                      {item.descripcionNamtrik && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium italic mt-1">
                          «{item.descripcionNamtrik}»
                        </p>
                      )}
                      {item.descripcionEspanol && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.descripcionEspanol}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        {item.hablanteAutor && <span>Autor: {item.hablanteAutor}</span>}
                        {item.varianteDialectal && <span>Variante: {item.varianteDialectal}</span>}
                        <span>{(Number(item.sizeBytes) / 1024).toFixed(1)} kB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {canWriteMedia && item.estado === 'borrador' && (
                      <button
                        type="button"
                        onClick={() => handleRatifyMedia(item.id)}
                        disabled={ratifyMediaMutation.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        Ratificar
                      </button>
                    )}

                    {canDeleteMedia && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(item.id)}
                        disabled={deleteMediaMutation.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
        </div>
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
