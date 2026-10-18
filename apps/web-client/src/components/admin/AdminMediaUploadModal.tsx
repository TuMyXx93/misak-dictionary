/**
 * AdminMediaUploadModal — Phase 5 · Spec 007 (Medios Escalonados)
 *
 * Modal accesible para la carga y catalogación de medios culturales (R-014):
 * - Soporta audios (MP3, OGG, WAV, WebM) e ilustraciones (WebP, JPEG, PNG, SVG).
 * - Catalogación cultural con propósito, hablante/autor, variante y licencia colectiva.
 * - Asociación opcional a sentidos léxicos o formas namtrik.
 * - Validación cliente de límite de tamaño (10 MB máx) y tipos permitidos.
 */

import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { type AdminMediaItem, useUploadAdminMedia } from '@/hooks/useAdmin';

export interface AdminMediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentidoId?: string;
  formaId?: string;
  sentidoLema?: string;
  onSuccess?: (nuevoMedio: AdminMediaItem) => void;
}

const PROPOSITOS_AUDIO = [
  { value: 'pronunciacion_lema', label: 'Pronunciación estándar del lema' },
  { value: 'contexto_oracion', label: 'Pronunciación en oración / contexto' },
  { value: 'pregunta_dialogo', label: 'Audio de la pregunta (diálogo)' },
  { value: 'respuesta_dialogo', label: 'Audio de la respuesta (diálogo)' },
];

const PROPOSITOS_IMAGEN = [
  { value: 'ilustracion_cultural', label: 'Ilustración cultural tradicional' },
  { value: 'fotografia_territorio', label: 'Fotografía del territorio o práctica cultural' },
];

export const AdminMediaUploadModal = ({
  isOpen,
  onClose,
  sentidoId,
  formaId,
  sentidoLema,
  onSuccess,
}: AdminMediaUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<'audio' | 'imagen'>('audio');
  const [proposito, setProposito] = useState<string>('pronunciacion_lema');
  const [hablanteAutor, setHablanteAutor] = useState('');
  const [varianteDialectal, setVarianteDialectal] = useState('');
  const [descripcionEspanol, setDescripcionEspanol] = useState('');
  const [descripcionNamtrik, setDescripcionNamtrik] = useState('');
  const [licenciaComunitaria, setLicenciaComunitaria] = useState(
    'Propiedad Intelectual Colectiva del Pueblo Misak',
  );
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const uploadMutation = useUploadAdminMedia();

  // Reset del formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setTipo('audio');
      setProposito('pronunciacion_lema');
      setHablanteAutor('');
      setVarianteDialectal('');
      setDescripcionEspanol('');
      setDescripcionNamtrik('');
      setLicenciaComunitaria('Propiedad Intelectual Colectiva del Pueblo Misak');
      setErrorLocal(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorLocal(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Límite de 10 MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorLocal('El archivo seleccionado supera el límite máximo permitido de 10 MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);

    // Detección automática del tipo por mimetype
    if (selectedFile.type.startsWith('image/')) {
      setTipo('imagen');
      setProposito('ilustracion_cultural');
    } else if (selectedFile.type.startsWith('audio/')) {
      setTipo('audio');
      setProposito('pronunciacion_lema');
    }
  };

  const handleTipoChange = (newTipo: 'audio' | 'imagen') => {
    setTipo(newTipo);
    if (newTipo === 'audio') {
      setProposito('pronunciacion_lema');
    } else {
      setProposito('ilustracion_cultural');
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

    if (sentidoId) formData.append('sentidoId', sentidoId);
    if (formaId) formData.append('formaId', formaId);
    if (hablanteAutor.trim()) formData.append('hablanteAutor', hablanteAutor.trim());
    if (varianteDialectal.trim()) formData.append('varianteDialectal', varianteDialectal.trim());
    if (descripcionEspanol.trim()) formData.append('descripcionEspanol', descripcionEspanol.trim());
    if (descripcionNamtrik.trim()) formData.append('descripcionNamtrik', descripcionNamtrik.trim());
    if (licenciaComunitaria.trim()) {
      formData.append('licenciaComunitaria', licenciaComunitaria.trim());
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-media-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="upload-media-title" className="text-xl font-bold font-display text-primary">
              Cargar Medio Cultural
            </h2>
            {sentidoLema && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Vinculando a:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {sentidoLema}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de carga"
            className="min-w-[48px] min-h-[48px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {errorLocal && (
            <div
              role="alert"
              className="p-3 text-sm rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
            >
              {errorLocal}
            </div>
          )}

          {/* Selección de Tipo */}
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Medio Cultural
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTipoChange('audio')}
                className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                  tipo === 'audio'
                    ? 'border-primary bg-primary/10 text-primary dark:text-primary-light ring-2 ring-primary/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
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
                onClick={() => handleTipoChange('imagen')}
                className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                  tipo === 'imagen'
                    ? 'border-primary bg-primary/10 text-primary dark:text-primary-light ring-2 ring-primary/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
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
            </div>
          </fieldset>

          {/* Archivo */}
          <div>
            <label
              htmlFor="media-file-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Archivo binario (Máx 10 MB) <span className="text-rose-500">*</span>
            </label>
            <input
              id="media-file-input"
              type="file"
              accept={
                tipo === 'audio'
                  ? 'audio/mpeg,audio/ogg,audio/wav,audio/webm,.mp3,.ogg,.wav,.webm'
                  : 'image/webp,image/jpeg,image/png,image/svg+xml,.webp,.jpg,.jpeg,.png,.svg'
              }
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-800/50"
            />
            {file && (
              <p className="text-xs text-slate-500 mt-1">
                Seleccionado:{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">{file.name}</span>{' '}
                ({(file.size / 1024).toFixed(1)} kB)
              </p>
            )}
          </div>

          {/* Propósito */}
          <div>
            <label
              htmlFor="proposito-select"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Propósito Cultural <span className="text-rose-500">*</span>
            </label>
            <select
              id="proposito-select"
              value={proposito}
              onChange={(e) => setProposito(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              {(tipo === 'audio' ? PROPOSITOS_AUDIO : PROPOSITOS_IMAGEN).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hablante / Fotógrafo / Autor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="hablante-autor-input"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Hablante / Autor / Fotógrafo
              </label>
              <input
                id="hablante-autor-input"
                type="text"
                placeholder="Ej. Taita Lorenzo Muelas"
                value={hablanteAutor}
                onChange={(e) => setHablanteAutor(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="variante-dialectal-input"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Variante Dialectal
              </label>
              <input
                id="variante-dialectal-input"
                type="text"
                placeholder="Ej. Guambía Central, Piscitau"
                value={varianteDialectal}
                onChange={(e) => setVarianteDialectal(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Descripciones */}
          <div>
            <label
              htmlFor="desc-espanol-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Descripción en Español
            </label>
            <textarea
              id="desc-espanol-input"
              rows={2}
              placeholder="Explicación contextual del recurso..."
              value={descripcionEspanol}
              onChange={(e) => setDescripcionEspanol(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="desc-namtrik-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Descripción / Glosa en Namtrik
            </label>
            <textarea
              id="desc-namtrik-input"
              rows={2}
              placeholder="Namtrik wan wam..."
              value={descripcionNamtrik}
              onChange={(e) => setDescripcionNamtrik(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Licencia */}
          <div>
            <label
              htmlFor="licencia-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Licencia Comunitaria Misak
            </label>
            <input
              id="licencia-input"
              type="text"
              value={licenciaComunitaria}
              onChange={(e) => setLicenciaComunitaria(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Botones de acción (tap target >= 48px) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={uploadMutation.isPending}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !file}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-slate-900 font-semibold text-sm transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 animate-spin text-slate-900"
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
