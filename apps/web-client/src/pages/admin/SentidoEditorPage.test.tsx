import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import * as useAdminModule from '@/hooks/useAdmin';
import { AdminApiError } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';
import { SentidoEditorPage } from './SentidoEditorPage';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminSentido: vi.fn(),
  useCreateSentido: vi.fn(),
  useUpdateSentido: vi.fn(),
  useAdminAbreviaturas: vi.fn(() => ({
    data: [
      { id: 'abrev-s', codigo: 's.', etiquetaCompleta: 'Sustantivo', orden: 33, activo: true },
      { id: 'abrev-v', codigo: 'v.', etiquetaCompleta: 'Verbo', orden: 36, activo: true },
    ],
    isLoading: false,
  })),
  useCreateAbreviatura: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateAbreviatura: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteAbreviatura: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useAdminMediaList: vi.fn(() => ({ data: { items: [], total: 0 }, refetch: vi.fn() })),
  useDeleteAdminMedia: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRatifyAdminMedia: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUploadAdminMedia: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateAdminMediaMetadata: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useAdminMediaTaxonomyCatalog: vi.fn(() => ({ data: [], isLoading: false })),
  useAdminMediaSentidoSearch: vi.fn(() => ({ data: [], isLoading: false })),
}));

describe('SentidoEditorPage (T-044, R-007, R-008, R-010, R-022)', () => {
  const mockCreateMutateAsync = vi.fn();
  const mockUpdateMutateAsync = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAdminModule.useCreateSentido).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useCreateSentido>);

    vi.mocked(useAdminModule.useUpdateSentido).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useUpdateSentido>);
  });

  afterEach(() => {
    cleanup();
    useAuthStore.getState().clearSession();
  });

  const renderComponent = (initialEntry: string) => {
    return render(
      <AudioPlayerProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/admin/sentidos/nuevo" element={<SentidoEditorPage />} />
            <Route path="/admin/sentidos/:id/editar" element={<SentidoEditorPage />} />
            <Route path="/admin/sentidos" element={<div>Lista de Sentidos</div>} />
          </Routes>
        </MemoryRouter>
      </AudioPlayerProvider>,
    );
  };

  it('en modo creación permite completar el formulario con CampoNamtrik y llama a useCreateSentido', async () => {
    vi.mocked(useAdminModule.useAdminSentido).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentido>);

    mockCreateMutateAsync.mockResolvedValueOnce({ id: 'new-id' });

    renderComponent('/admin/sentidos/nuevo');

    expect(screen.getByRole('heading', { name: /nuevo sentido léxico/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/código del sentido/i), {
      target: { value: 'C1.S1.M5.E001' },
    });
    fireEvent.change(screen.getByLabelText(/código del nodo microcampo/i), {
      target: { value: 'C1.S1.M5' },
    });
    fireEvent.change(screen.getByLabelText(/lema \(namtrik\)/i), {
      target: { value: 'kɵtɵ' },
    });
    fireEvent.change(screen.getByLabelText(/glosa \/ definición/i), {
      target: { value: 'casa tradicional' },
    });

    const submitBtn = screen.getByRole('button', { name: /crear sentido/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: 'C1.S1.M5.E001',
          nodoCodigo: 'C1.S1.M5',
          lema: 'kɵtɵ',
          glosa: 'casa tradicional',
        }),
      );
      expect(screen.getByText('Lista de Sentidos')).toBeInTheDocument();
    });
  });

  it('en modo edición muestra advertencia de retorno a borrador si está ratificado (R-010)', () => {
    vi.mocked(useAdminModule.useAdminSentido).mockReturnValue({
      data: {
        id: 's-edit-1',
        codigo: 'C1.S1.M1.E005',
        lema: 'mɵi',
        glosa: 'persona',
        estado: 'ratificado',
        version: 3,
        tipo: 'termino',
      },
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentido>);

    renderComponent('/admin/sentidos/s-edit-1/editar');

    expect(
      screen.getByRole('heading', { name: /editar sentido \(c1\.s1\.m1\.e005\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/versión actual: v3/i)).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /aviso de retorno a borrador/i }),
    ).toBeInTheDocument();
  });

  it('abre ConflictoVersionDialog ante error 409 y permite sobrescribir con nueva versión (R-007)', async () => {
    vi.mocked(useAdminModule.useAdminSentido).mockReturnValue({
      data: {
        id: 's-edit-2',
        codigo: 'C1.S1.M1.E006',
        lema: 'pish',
        glosa: 'agua pura',
        estado: 'borrador',
        version: 1,
        tipo: 'termino',
      },
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentido>);

    // Primer intento rechaza con 409
    const conflictError = new AdminApiError(409, 'Conflicto de versión', 'Conflict', {
      serverVersion: 2,
      serverData: { lema: 'pish nuevo', glosa: 'agua pura y cristalina' },
    });
    mockUpdateMutateAsync.mockRejectedValueOnce(conflictError);
    // Segundo intento exitoso
    mockUpdateMutateAsync.mockResolvedValueOnce({ success: true, version: 2 });

    renderComponent('/admin/sentidos/s-edit-2/editar');

    const submitBtn = screen.getByRole('button', { name: /guardar cambios/i });
    await userEvent.click(submitBtn);

    // Debe mostrar diálogo de conflicto
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/conflicto de edición concurrente \(versión 2\)/i)).toBeInTheDocument();

    // Clic en sobrescribir
    const overwriteBtn = screen.getByRole('button', { name: /sobrescribir con mis cambios/i });
    await userEvent.click(overwriteBtn);

    await waitFor(() => {
      // Debe haber reintentado con version = 2
      expect(mockUpdateMutateAsync).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: 's-edit-2',
          version: 2,
        }),
      );
      expect(screen.getByText('Lista de Sentidos')).toBeInTheDocument();
    });
  });

  it('en modo edición permite alternar a la pestaña de Medios Culturales (R-014, T-037)', async () => {
    vi.mocked(useAdminModule.useAdminSentido).mockReturnValue({
      data: {
        id: 's-edit-3',
        codigo: 'S-003',
        lema: 'mɵk',
        glosa: 'hombre / varón',
        categoriaGramatical: 'sustantivo',
        tipo: 'termino',
        version: 1,
        estado: 'borrador',
      },
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentido>);

    renderComponent('/admin/sentidos/s-edit-3/editar');

    const tabMedios = screen.getByRole('tab', { name: /medios culturales/i });
    expect(tabMedios).toBeInTheDocument();

    await userEvent.click(tabMedios);

    expect(
      screen.getByRole('heading', { name: /medios culturales vinculados/i }),
    ).toBeInTheDocument();
  });

  it('permite gestionar formas léxicas múltiples, neologismos y modal de abreviaturas', async () => {
    vi.mocked(useAdminModule.useAdminSentido).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentido>);

    renderComponent('/admin/sentidos/nuevo');

    // Añadir segunda forma léxica
    const addFormaBtn = screen.getByRole('button', { name: /\+ añadir forma \/ variante/i });
    await userEvent.click(addFormaBtn);

    expect(screen.getByText(/forma #2/i)).toBeInTheDocument();

    // Editar variante dialectal de la segunda forma
    const varianteInputs = screen.getAllByPlaceholderText(/ej: v\. 1, occidental/i);
    await userEvent.type(varianteInputs[1], 'Variante Guambía');

    // Marcar como neologismo
    const neologismoCheckboxes = screen.getAllByRole('checkbox', {
      name: /¿es neologismo comunitario\?/i,
    });
    await userEvent.click(neologismoCheckboxes[1]);
    expect(neologismoCheckboxes[1]).toBeChecked();

    // Abrir modal de abreviaturas
    const openAbrevBtn = screen.getAllByRole('button', {
      name: /\+ nueva \/ gestionar abreviaturas/i,
    });
    await userEvent.click(openAbrevBtn[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Cerrar modal
    const closeDialogBtn = screen.getByRole('button', { name: /^cerrar$/i });
    await userEvent.click(closeDialogBtn);

    // Eliminar la segunda forma léxica
    const deleteFormaBtn = screen.getByRole('button', { name: /eliminar forma/i });
    await userEvent.click(deleteFormaBtn);
    expect(screen.queryByText(/forma #2/i)).toBeNull();
  });

  it('soporta entrada de tipo dialógico con campos de diálogo', async () => {
    vi.mocked(useAdminModule.useAdminSentido).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentido>);

    renderComponent('/admin/sentidos/nuevo');

    const tipoSelect = screen.getByLabelText(/tipo de entrada/i);
    await userEvent.selectOptions(tipoSelect, 'dialogico');

    expect(screen.getByRole('heading', { name: /5\. estructura dialógica/i })).toBeInTheDocument();

    const explicacionInput = screen.getByLabelText(/explicación cultural extendida/i);
    await userEvent.type(explicacionInput, 'Uso ceremonial tradicional');
    expect(explicacionInput).toHaveValue('Uso ceremonial tradicional');
  });

  it('en pestaña Medios Culturales ofrece diálogo Desvincular vs Papelera, edición, descarga, vinculación existente y valida taxonomy:ratify (Spec 014)', async () => {
    const mockRefetchMedia = vi.fn();
    const mockDeleteMedia = vi.fn().mockResolvedValue({ success: true });
    const mockUpdateMeta = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'med-1' },
    });
    const mockRatifyMedia = vi.fn().mockResolvedValue({ success: true });

    useAuthStore.getState().setSession(
      {
        userId: 'editor-1',
        email: 'editor@namtrik.org',
        roles: ['content_admin'],
        permissions: [
          'dictionary:read',
          'dictionary:write',
          'media:read',
          'media:write',
          'media:delete',
        ],
      },
      'token-ed',
    );

    vi.mocked(useAdminModule.useAdminSentido).mockReturnValue({
      data: {
        id: 's-edit-media',
        codigo: 'C4.S6.E021',
        lema: 'Milu kalik',
        glosa: 'Caracol',
        categoriaGramatical: 's.',
        tipo: 'termino',
        version: 3,
        estado: 'borrador',
        formas: [{ id: 'f-21', orden: 1, lema: 'Milu kalik', categoriaGramatical: 's.' }],
      },
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentido>);

    vi.mocked(useAdminModule.useAdminMediaList).mockReturnValue({
      data: {
        items: [
          {
            id: 'med-1',
            uuid: 'uuid-med-1',
            tipo: 'audio',
            proposito: 'pronunciacion_lema',
            filename: 'milu_kalik.mp3',
            originalName: 'milu_kalik.mp3',
            mimetype: 'audio/mpeg',
            sizeBytes: '16000',
            hashSha256: 'hash-med-1',
            estado: 'borrador',
            licenciaComunitaria: 'Propiedad Colectiva Misak',
            sentidoId: 's-edit-media',
            createdAt: '2026-10-18T10:00:00Z',
            updatedAt: '2026-10-18T10:00:00Z',
          },
        ],
        total: 1,
      },
      refetch: mockRefetchMedia,
    } as unknown as ReturnType<typeof useAdminModule.useAdminMediaList>);

    vi.mocked(useAdminModule.useDeleteAdminMedia).mockReturnValue({
      mutateAsync: mockDeleteMedia,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useDeleteAdminMedia>);

    vi.mocked(useAdminModule.useUpdateAdminMediaMetadata).mockReturnValue({
      mutateAsync: mockUpdateMeta,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useUpdateAdminMediaMetadata>);

    vi.mocked(useAdminModule.useRatifyAdminMedia).mockReturnValue({
      mutateAsync: mockRatifyMedia,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useRatifyAdminMedia>);

    renderComponent('/admin/sentidos/s-edit-media/editar');

    await userEvent.click(screen.getByRole('tab', { name: /medios culturales/i }));

    // Sin taxonomy:ratify, no aparece el botón Ratificar aunque tenga media:write
    expect(screen.queryByRole('button', { name: /^ratificar$/i })).toBeNull();
    expect(screen.getByRole('link', { name: /descargar/i })).toHaveAttribute(
      'href',
      '/api/media/uuid-med-1/stream?download=1',
    );
    expect(screen.getByRole('button', { name: /vincular medio existente/i })).toBeInTheDocument();

    // Abrir diálogo Desvincular vs Papelera y pulsar Desvincular
    await userEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));
    expect(
      screen.getByRole('heading', { name: /¿qué desea hacer con este medio cultural\?/i }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /desvincular de este sentido/i }));

    await waitFor(() => {
      expect(mockUpdateMeta).toHaveBeenCalledWith({
        id: 'med-1',
        data: { sentidoId: null, formaId: null },
      });
    });

    // Abrir diálogo nuevamente y Enviar a Papelera
    await userEvent.click(screen.getByRole('button', { name: /^eliminar$/i }));
    await userEvent.click(screen.getByRole('button', { name: /enviar a papelera/i }));

    await waitFor(() => {
      expect(mockDeleteMedia).toHaveBeenCalledWith('med-1');
    });

    // Con taxonomy:ratify sí permite ratificar desde el editor
    act(() => {
      useAuthStore.getState().setSession(
        {
          userId: 'rev-1',
          email: 'rev@namtrik.org',
          roles: ['cultural_reviewer'],
          permissions: ['dictionary:read', 'media:read', 'media:write', 'taxonomy:ratify'],
        },
        'token-rev',
      );
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^ratificar$/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /^ratificar$/i }));

    await waitFor(() => {
      expect(mockRatifyMedia).toHaveBeenCalledWith('med-1');
    });
  });
});
