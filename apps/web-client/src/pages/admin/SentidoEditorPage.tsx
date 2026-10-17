/**
 * SentidoEditorPage
 * Spec 006 (R-007, R-008, R-010, R-022, T-044)
 * Formulario para creación y edición de sentidos léxicos con soporte para CampoNamtrik,
 * control de versión optimista (R-007), retorno a borrador (R-010) y resolución de 409.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CampoNamtrik } from '@/components/admin/CampoNamtrik';
import { ConflictoVersionDialog } from '@/components/admin/ConflictoVersionDialog';
import { useAdminSentido, useCreateSentido, useUpdateSentido } from '@/hooks/useAdmin';
import { AdminApiError } from '@/services/adminHttp';

export function SentidoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'nuevo');
  const navigate = useNavigate();

  const { data: sentido, isLoading, refetch } = useAdminSentido(isEditing ? id : undefined);
  const createMutation = useCreateSentido();
  const updateMutation = useUpdateSentido();

  // Campos de formulario
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

  const handleSubmit = async (e?: React.FormEvent, forceVersion?: number) => {
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
        // Concurrencia optimista (R-007)
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

  if (isEditing && isLoading) {
    return (
      <div className="py-12 text-center text-slate-500" role="status">
        Cargando datos del sentido...
      </div>
    );
  }

  const isRatificado = sentido?.estado === 'ratificado';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? `Editar sentido (${sentido?.codigo ?? ''})` : 'Nuevo sentido léxico'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isEditing
              ? `Versión actual: v${localVersion} (R-007)`
              : 'Registrar nueva entrada léxica en la taxonomía'}
          </p>
        </div>
        <Link
          to="/admin/sentidos"
          className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 border border-slate-300 rounded-md"
        >
          Volver a la lista
        </Link>
      </div>

      {isRatificado && (
        <div
          role="region"
          aria-label="Aviso de retorno a borrador"
          className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 text-sm rounded-r-md"
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
          className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md"
        >
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Código */}
          <div>
            <label htmlFor="sentido-codigo" className="block text-sm font-medium text-slate-700">
              Código del sentido{' '}
              {isEditing && <span className="text-xs text-slate-500">(Inmutable)</span>}
            </label>
            <input
              id="sentido-codigo"
              type="text"
              required
              disabled={isEditing}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: C1.S1.M5.E003"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          {/* Nodo / Jerarquía */}
          {!isEditing && (
            <div>
              <label htmlFor="sentido-nodo" className="block text-sm font-medium text-slate-700">
                Código del nodo microcampo
              </label>
              <input
                id="sentido-nodo"
                type="text"
                required
                value={nodoCodigo}
                onChange={(e) => setNodoCodigo(e.target.value)}
                placeholder="Ej: C1.S1.M5"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          )}

          {/* Tipo */}
          <div>
            <label htmlFor="sentido-tipo" className="block text-sm font-medium text-slate-700">
              Tipo de entrada
            </label>
            <select
              id="sentido-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'termino' | 'variante' | 'ejemplo')}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="termino">Término principal</option>
              <option value="variante">Variante dialectal / fonética</option>
              <option value="ejemplo">Ejemplo de uso</option>
            </select>
          </div>

          {/* Categoría gramatical */}
          <div>
            <label htmlFor="sentido-cat" className="block text-sm font-medium text-slate-700">
              Categoría gramatical
            </label>
            <select
              id="sentido-cat"
              value={categoriaGramatical}
              onChange={(e) => setCategoriaGramatical(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="sustantivo">Sustantivo</option>
              <option value="verbo">Verbo</option>
              <option value="adjetivo">Adjetivo</option>
              <option value="adverbio">Adverbio</option>
              <option value="pronombre">Pronombre</option>
              <option value="interjeccion">Interjección</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        {/* Lema en Namtrik con CampoNamtrik (R-022) */}
        <div>
          <CampoNamtrik
            id="sentido-lema"
            label="Lema (Namtrik)"
            value={lema}
            onChange={setLema}
            required
            helperText="Escriba en lengua Namtrik. Use los botones para insertar ɵ o Ɵ según corresponda."
          />
        </div>

        {/* Glosa en castellano */}
        <div>
          <label htmlFor="sentido-glosa" className="block text-sm font-medium text-slate-700">
            Glosa / Definición (Castellano)
          </label>
          <textarea
            id="sentido-glosa"
            required
            rows={3}
            value={glosa}
            onChange={(e) => setGlosa(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
            placeholder="Significado del sentido en castellano..."
          />
        </div>

        {/* Ejemplos adicionales opcionales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
          <div>
            <CampoNamtrik
              id="ejemplo-namtrik"
              label="Ejemplo de uso (Namtrik, opcional)"
              value={ejemploNamtrik}
              onChange={setEjemploNamtrik}
              multiline
              rows={2}
            />
          </div>
          <div>
            <label htmlFor="ejemplo-espanol" className="block text-sm font-medium text-slate-700">
              Traducción del ejemplo (Castellano, opcional)
            </label>
            <textarea
              id="ejemplo-espanol"
              rows={2}
              value={ejemploEspanol}
              onChange={(e) => setEjemploEspanol(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
          <Link
            to="/admin/sentidos"
            className="px-4 py-2 min-h-[48px] inline-flex items-center justify-center border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-6 py-2 min-h-[48px] bg-sky-700 hover:bg-sky-800 text-white rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear sentido'}
          </button>
        </div>
      </form>

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
