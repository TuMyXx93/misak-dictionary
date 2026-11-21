import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminMediaItem } from '@/hooks/useAdmin';
import * as useAdminModule from '@/hooks/useAdmin';
import { AdminMediaEditModal } from './AdminMediaEditModal';

vi.mock('@/hooks/useAdmin', () => ({
  useUpdateAdminMediaMetadata: vi.fn(),
  useAdminMediaTaxonomyCatalog: vi.fn(),
  useAdminMediaSentidoSearch: vi.fn(),
}));

describe('AdminMediaEditModal (Spec 014 R-004, R-010)', () => {
  const mockUpdateMutateAsync = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const ratifiedAudioMedia: AdminMediaItem = {
    id: 'med-edit-1',
    uuid: 'uuid-edit-1',
    tipo: 'audio',
    proposito: 'pronunciacion_lema',
    filename: 'shoka.mp3',
    originalName: 'shoka_original.mp3',
    mimetype: 'audio/mpeg',
    sizeBytes: '18432',
    hashSha256: 'hash-edit-1',
    estado: 'ratificado',
    hablanteAutor: 'Taita Lorenzo',
    varianteDialectal: 'Guambía',
    descripcionEspanol: 'Pronunciación anterior',
    descripcionNamtrik: 'Shɵka',
    licenciaComunitaria: 'Propiedad Intelectual Colectiva del Pueblo Misak',
    sentidoId: 's-1',
    sentido: {
      id: 's-1',
      codigo: 'C1.S1.M1.E001',
      espanolGlosa: 'Totuma',
      formas: [{ id: 'f-1', lema: 'Shɵka' }],
    },
    createdAt: '2026-10-17T12:00:00Z',
    updatedAt: '2026-10-17T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdminModule.useUpdateAdminMediaMetadata).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useUpdateAdminMediaMetadata>);

    vi.mocked(useAdminModule.useAdminMediaTaxonomyCatalog).mockReturnValue({
      data: [
        {
          id: '1',
          codigo: 'C1',
          slug: 'territorio',
          namtrikTermino: 'Pirɵ',
          espanolTermino: 'Territorio y naturaleza',
          nivel: 'campo',
          hijos: [],
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useAdminModule.useAdminMediaTaxonomyCatalog>);

    vi.mocked(useAdminModule.useAdminMediaSentidoSearch).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useAdminModule.useAdminMediaSentidoSearch>);
  });

  afterEach(() => {
    cleanup();
  });

  it('muestra advertencia R-010 para medios ratificados, descarga autenticada y guarda metadatos actualizados', async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({
      success: true,
      data: { ...ratifiedAudioMedia, estado: 'borrador', hablanteAutor: 'Mama Carmela' },
    });

    render(
      <AdminMediaEditModal
        isOpen
        onClose={mockOnClose}
        media={ratifiedAudioMedia}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByRole('note')).toHaveTextContent(/atención \(r-010\)/i);

    const downloadLink = screen.getByRole('link', { name: /descargar archivo original/i });
    expect(downloadLink).toHaveAttribute('href', '/api/media/uuid-edit-1/stream?download=1');

    const propositoSelect = screen.getByLabelText(/propósito cultural/i);
    await userEvent.selectOptions(propositoSelect, 'contexto_oracion');

    const hablanteInput = screen.getByLabelText(/hablante \/ autor \/ fotógrafo/i);
    await userEvent.clear(hablanteInput);
    await userEvent.type(hablanteInput, 'Mama Carmela');

    const submitBtn = screen.getByRole('button', { name: /guardar cambios/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'med-edit-1',
        data: expect.objectContaining({
          proposito: 'contexto_oracion',
          hablanteAutor: 'Mama Carmela',
          sentidoId: 's-1',
        }),
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('renderiza alerta accesible si falla el guardado de metadatos', async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error('No se pudo actualizar metadatos'));

    render(
      <AdminMediaEditModal
        isOpen
        onClose={mockOnClose}
        media={{ ...ratifiedAudioMedia, estado: 'borrador' }}
      />,
    );

    expect(screen.queryByRole('note')).toBeNull();

    const form = screen.getByRole('button', { name: /guardar cambios/i }).closest('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo actualizar metadatos');
    });
  });
});
