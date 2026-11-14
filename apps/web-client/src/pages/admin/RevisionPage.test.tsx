import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import * as useAdminModule from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';
import { RevisionPage } from './RevisionPage';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminSentidos: vi.fn(),
  useRatificarSentido: vi.fn(),
  useRevertirSentido: vi.fn(),
  useRatificarLote: vi.fn(),
  useAdminMediaList: vi.fn(),
  useRatifyAdminMedia: vi.fn(),
}));

describe('RevisionPage (T-045, R-011, R-013, R-014, R-025)', () => {
  const mockBorradores = {
    items: [
      {
        id: 'rev-1',
        codigo: 'C1.S1.M2.E001',
        lema: 'kanɵ',
        glosa: 'uno / unidad',
        estado: 'borrador' as const,
        version: 1,
        tipo: 'termino',
        updatedAt: '2026-10-16T10:00:00Z',
      },
    ],
  };

  const mockRatificarMutateAsync = vi.fn();
  const mockRevertirMutateAsync = vi.fn();
  const mockRatificarLoteMutateAsync = vi.fn();
  const mockRatifyMediaMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.getState().setSession(
      {
        userId: 'rev-user-1',
        email: 'revisor@namtrik.org',
        roles: ['cultural_reviewer'],
        permissions: ['taxonomy:read', 'taxonomy:ratify', 'taxonomy:revert', 'media:read'],
      },
      'token-rev',
    );

    vi.mocked(useAdminModule.useAdminSentidos).mockReturnValue({
      data: mockBorradores,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentidos>);

    vi.mocked(useAdminModule.useRatificarSentido).mockReturnValue({
      mutateAsync: mockRatificarMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useRatificarSentido>);

    vi.mocked(useAdminModule.useRevertirSentido).mockReturnValue({
      mutateAsync: mockRevertirMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useRevertirSentido>);

    vi.mocked(useAdminModule.useRatificarLote).mockReturnValue({
      mutateAsync: mockRatificarLoteMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useRatificarLote>);

    vi.mocked(useAdminModule.useAdminMediaList).mockReturnValue({
      data: {
        items: [
          {
            id: 'med-pend-1',
            uuid: 'uuid-med-pend-1',
            tipo: 'audio',
            proposito: 'pronunciacion_lema',
            filename: 'pisindo.mp3',
            originalName: 'pisindo.mp3',
            mimetype: 'audio/mpeg',
            sizeBytes: '12345',
            hashSha256: 'hash-med-1',
            estado: 'borrador',
            hablanteAutor: 'Mama Manuela',
            varianteDialectal: 'Guambía',
            descripcionEspanol: 'Pronunciación de Pisindɵ',
            licenciaComunitaria: 'Propiedad Colectiva Misak',
            createdAt: '2026-10-18T10:00:00Z',
            updatedAt: '2026-10-18T10:00:00Z',
            sentido: {
              id: 's-40',
              codigo: 'C4.S6.E040',
              espanolGlosa: 'Caracol grande',
              formas: [{ id: 'f-40', lema: 'Pisindɵ' }],
            },
          },
        ],
        total: 1,
        limit: 30,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useAdminMediaList>);

    vi.mocked(useAdminModule.useRatifyAdminMedia).mockReturnValue({
      mutateAsync: mockRatifyMediaMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useRatifyAdminMedia>);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <AudioPlayerProvider>
        <BrowserRouter>
          <RevisionPage />
        </BrowserRouter>
      </AudioPlayerProvider>,
    );

  it('renderiza la cola de borradores y permite ratificar con checklist (R-011)', async () => {
    mockRatificarMutateAsync.mockResolvedValueOnce({ success: true });
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /cola editorial de revisión/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('C1.S1.M2.E001')).toBeInTheDocument();
    expect(screen.getByText('kanɵ')).toBeInTheDocument();

    const ratifyBtn = screen.getByRole('button', { name: /^ratificar$/i });
    expect(screen.queryByRole('button', { name: /revertir/i })).toBeNull();
    await userEvent.click(ratifyBtn);

    // Diálogo abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /confirmar ratificación/i });
    expect(confirmBtn).toBeDisabled();

    // Marcar checkboxes del checklist
    const checkboxes = screen.getAllByRole('checkbox');
    for (const chk of checkboxes) {
      await userEvent.click(chk);
    }

    expect(confirmBtn).not.toBeDisabled();
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRatificarMutateAsync).toHaveBeenCalledWith({ id: 'rev-1', version: 1 });
      expect(screen.getByRole('alert')).toHaveTextContent(/ratificado exitosamente/i);
    });
  });

  it('envía la versión real (v2+) al ratificar un sentido editado previamente (Spec 013 R-001)', async () => {
    vi.mocked(useAdminModule.useAdminSentidos).mockReturnValue({
      data: {
        items: [
          {
            id: 'rev-v2',
            codigo: 'C4.S6.E021',
            lema: 'Milu kalik',
            glosa: 'Caracol (Gastropoda)',
            estado: 'borrador' as const,
            version: 2,
            tipo: 'termino',
            updatedAt: '2026-11-11T10:00:00Z',
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentidos>);
    mockRatificarMutateAsync.mockResolvedValueOnce({ success: true });

    renderComponent();

    expect(screen.getByText('v2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^ratificar$/i }));

    for (const chk of screen.getAllByRole('checkbox')) {
      await userEvent.click(chk);
    }
    await userEvent.click(screen.getByRole('button', { name: /confirmar ratificación/i }));

    await waitFor(() => {
      expect(mockRatificarMutateAsync).toHaveBeenCalledWith({ id: 'rev-v2', version: 2 });
    });
  });

  it('exige motivo de al menos 10 caracteres para revertir un sentido ratificado (R-003, R-013)', async () => {
    vi.mocked(useAdminModule.useAdminSentidos).mockReturnValue({
      data: {
        items: [
          {
            id: 'rev-1',
            codigo: 'C1.S1.M2.E001',
            lema: 'kanɵ',
            glosa: 'uno / unidad',
            estado: 'ratificado' as const,
            version: 3,
            tipo: 'termino',
            updatedAt: '2026-10-16T10:00:00Z',
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentidos>);
    mockRevertirMutateAsync.mockResolvedValueOnce({ success: true });
    renderComponent();

    expect(screen.queryByRole('button', { name: /^ratificar$/i })).toBeNull();
    const revertBtn = screen.getByRole('button', { name: /revertir/i });
    await userEvent.click(revertBtn);

    expect(
      screen.getByRole('heading', { name: /revertir sentido \(c1\.s1\.m2\.e001\)/i }),
    ).toBeInTheDocument();

    const motivoInput = screen.getByLabelText(/motivo obligatorio/i);
    const confirmRevertBtn = screen.getByRole('button', { name: /confirmar reversión/i });

    // Con menos de 10 caracteres permanece deshabilitado
    await userEvent.type(motivoInput, 'Corto');
    expect(confirmRevertBtn).toBeDisabled();

    // Con >= 10 caracteres se habilita
    await userEvent.type(motivoInput, ' motivo de prueba válido');
    expect(confirmRevertBtn).not.toBeDisabled();

    await userEvent.click(confirmRevertBtn);

    await waitFor(() => {
      expect(mockRevertirMutateAsync).toHaveBeenCalledWith({
        id: 'rev-1',
        version: 3,
        motivo: 'Corto motivo de prueba válido',
      });
      expect(screen.getByRole('alert')).toHaveTextContent(/devuelto a revisión/i);
    });
  });

  it('permite ratificar por lote un microcampo completo (R-014, R-025)', async () => {
    mockRatificarLoteMutateAsync.mockResolvedValueOnce({ count: 12 });
    renderComponent();

    const loteInput = screen.getByPlaceholderText(/código microcampo/i);
    await userEvent.type(loteInput, 'C1.S1.M2');

    const loteBtn = screen.getByRole('button', { name: /ratificar lote/i });
    expect(loteBtn).not.toBeDisabled();
    await userEvent.click(loteBtn);

    // Diálogo de checklist para lote
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/ratificación editorial por lote \(c1\.s1\.m2\)/i)).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    for (const chk of checkboxes) {
      await userEvent.click(chk);
    }

    const confirmBtn = screen.getByRole('button', { name: /confirmar ratificación/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRatificarLoteMutateAsync).toHaveBeenCalledWith({
        microcampoCodigo: 'C1.S1.M2',
        snapshot: [{ id: 'rev-1', version: 1 }],
      });
      expect(screen.getByRole('alert')).toHaveTextContent(/12 sentidos aprobados/i);
    });
  });

  it('permite cambiar a la pestaña Medios Culturales por Ratificar y aprobar recursos pendientes (Spec 014 R-006/R-007)', async () => {
    mockRatifyMediaMutateAsync.mockResolvedValueOnce({ success: true });
    renderComponent();

    const mediosTab = screen.getByRole('tab', { name: /medios culturales por ratificar/i });
    expect(mediosTab).toHaveTextContent('(1)');
    await userEvent.click(mediosTab);

    expect(screen.getByText('pisindo.mp3')).toBeInTheDocument();
    expect(screen.getByText(/C4\.S6\.E040 · Pisindɵ/)).toBeInTheDocument();

    const ratifyMediaBtn = screen.getByRole('button', { name: /ratificar medio/i });
    await userEvent.click(ratifyMediaBtn);

    await waitFor(() => {
      expect(mockRatifyMediaMutateAsync).toHaveBeenCalledWith('med-pend-1');
      expect(screen.getByRole('alert')).toHaveTextContent(/ratificado exitosamente/i);
    });
  });
});
