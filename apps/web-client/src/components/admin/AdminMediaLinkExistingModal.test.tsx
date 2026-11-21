import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminMediaItem } from '@/hooks/useAdmin';
import * as useAdminModule from '@/hooks/useAdmin';
import { AdminMediaLinkExistingModal } from './AdminMediaLinkExistingModal';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminMediaList: vi.fn(),
  useUpdateAdminMediaMetadata: vi.fn(),
}));

vi.mock('@/components/ui/AudioPlayButton', () => ({
  AudioPlayButton: ({ trackId, lema }: { trackId: string; lema: string }) => (
    <button type="button" aria-label={`Reproducir ${lema}`} data-testid={`audio-${trackId}`}>
      Audio
    </button>
  ),
}));

describe('AdminMediaLinkExistingModal (Spec 014 R-004)', () => {
  const mockUpdateMutateAsync = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const repoItems: AdminMediaItem[] = [
    {
      id: 'med-linked',
      uuid: 'uuid-linked',
      tipo: 'audio',
      proposito: 'pronunciacion_lema',
      filename: 'ya_asociado.mp3',
      mimetype: 'audio/mpeg',
      sizeBytes: '1024',
      hashSha256: 'h1',
      estado: 'borrador',
      licenciaComunitaria: 'Propiedad Colectiva Misak',
      sentidoId: 's-1',
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-18T10:00:00Z',
    },
    {
      id: 'med-free',
      uuid: 'uuid-free',
      tipo: 'imagen',
      proposito: 'ilustracion_cultural',
      filename: 'totuma_campo.webp',
      originalName: 'totuma_campo.webp',
      mimetype: 'image/webp',
      sizeBytes: '2048',
      hashSha256: 'h2',
      estado: 'ratificado',
      descripcionEspanol: 'Totuma ceremonial',
      licenciaComunitaria: 'Propiedad Colectiva Misak',
      sentidoId: null,
      createdAt: '2026-10-18T11:00:00Z',
      updatedAt: '2026-10-18T11:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAdminModule.useAdminMediaList).mockReturnValue({
      data: { items: repoItems, total: 2, limit: 25, offset: 0 },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useAdminMediaList>);

    vi.mocked(useAdminModule.useUpdateAdminMediaMetadata).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useUpdateAdminMediaMetadata>);
  });

  afterEach(() => {
    cleanup();
  });

  it('marca como "Ya vinculado" los recursos del sentido y permite vincular uno disponible a una forma', async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({
      success: true,
      data: { ...repoItems[1], sentidoId: 's-1', formaId: 'f-2' },
    });

    render(
      <AdminMediaLinkExistingModal
        isOpen
        onClose={mockOnClose}
        sentidoId="s-1"
        sentidoLema="Shɵka"
        sentidoFormas={[
          { id: 'f-1', orden: 1, lema: 'Shɵka', variante: 'Guambía' },
          { id: 'f-2', orden: 2, lema: 'Shuka', variante: 'Silvia' },
        ]}
        existingMediaIds={['med-linked']}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByRole('button', { name: 'Ya vinculado' })).toBeDisabled();

    const formaSelect = screen.getByLabelText(/asociar a forma específica/i);
    await userEvent.selectOptions(formaSelect, 'f-2');

    const linkBtn = screen.getByRole('button', { name: 'Vincular aquí' });
    await userEvent.click(linkBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'med-free',
        data: { sentidoId: 's-1', formaId: 'f-2' },
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('muestra alerta accesible si falla la vinculación', async () => {
    mockUpdateMutateAsync.mockRejectedValueOnce(new Error('Fallo de red'));

    render(
      <AdminMediaLinkExistingModal
        isOpen
        onClose={mockOnClose}
        sentidoId="s-1"
        existingMediaIds={[]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Vincular aquí' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Fallo de red');
    });
  });
});
