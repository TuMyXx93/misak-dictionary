/**
 * AdminMediaPage.test.tsx — Spec 007
 *
 * Tests unitarios y de integración para la página de administración de medios culturales (/admin/medios, R-014):
 * - Renderizado de tabla de medios (audios, imágenes y videos culturales).
 * - Filtros por tipo (incluyendo video), estado y búsqueda por texto.
 * - Acciones de ratificación comunitaria (media:write).
 * - Modal y flujo de eliminación con diálogo de confirmación (media:delete).
 * - Apertura del modal de carga al presionar "Cargar medio".
 * - Paginación, previsualización Lightbox y estados vacíos.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminMediaItem } from '@/hooks/useAdmin';
import { AdminMediaPage } from './AdminMediaPage';

// Mocks de hooks y stores
const mockRatifyMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockHasPermission = vi.fn();

const mockMediaItems: AdminMediaItem[] = [
  {
    id: 'media-1',
    uuid: 'uuid-audio-1',
    tipo: 'audio',
    proposito: 'pronunciacion_lema',
    filename: 'shoka_pronunciacion.mp3',
    mimetype: 'audio/mpeg',
    sizeBytes: '24576',
    hashSha256: 'hash-1',
    estado: 'borrador',
    hablanteAutor: 'Taita Lorenzo',
    varianteDialectal: 'Guambía Central',
    descripcionEspanol: 'Pronunciación estándar del término Shøka',
    descripcionNamtrik: 'Shøka namtrik wan',
    licenciaComunitaria: 'Propiedad Colectiva Misak',
    createdAt: '2026-10-17T12:00:00Z',
    updatedAt: '2026-10-17T12:00:00Z',
    sentido: {
      id: 'sentido-1',
      codigo: 'S-001',
      espanolGlosa: 'Saludar ceremonialmente',
      formas: [{ id: 'forma-1', lema: 'Shøka' }],
    },
  },
  {
    id: 'media-2',
    uuid: 'uuid-img-1',
    tipo: 'imagen',
    proposito: 'ilustracion_cultural',
    filename: 'shur_anmpish.webp',
    mimetype: 'image/webp',
    sizeBytes: '102400',
    hashSha256: 'hash-2',
    estado: 'ratificado',
    hablanteAutor: 'Comunidad Guambiana',
    varianteDialectal: 'Piscitau',
    descripcionEspanol: 'Ilustración del traje tradicional Misak',
    descripcionNamtrik: 'Anmpish misak',
    licenciaComunitaria: 'Propiedad Colectiva Misak',
    anchoPx: 800,
    altoPx: 600,
    createdAt: '2026-10-17T13:00:00Z',
    updatedAt: '2026-10-17T13:00:00Z',
    sentido: {
      id: 'sentido-2',
      codigo: 'S-002',
      espanolGlosa: 'Vestimenta tradicional',
      formas: [{ id: 'forma-2', lema: 'Anmpish' }],
    },
  },
  {
    id: 'media-3',
    uuid: 'uuid-video-1',
    posterUuid: 'uuid-poster-1',
    tipo: 'video',
    proposito: 'registro_practica_cultural',
    filename: 'minga_siembra.mp4',
    mimetype: 'video/mp4',
    sizeBytes: String(45 * 1024 * 1024),
    duracionSegundos: 125,
    hashSha256: 'hash-3',
    estado: 'ratificado',
    hablanteAutor: 'Cabildo de Guambía',
    varianteDialectal: 'Silvia',
    descripcionEspanol: 'Registro audiovisual de la minga comunitaria',
    descripcionNamtrik: 'Minga namtrik',
    licenciaComunitaria: 'Propiedad Colectiva Misak',
    anchoPx: 1920,
    altoPx: 1080,
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
    campoSemantico: {
      id: '1',
      codigo: 'C1',
      namtrikTermino: 'Pirø',
      espanolTermino: 'Territorio y naturaleza',
    },
  },
];

let mockListQueryState: {
  data: {
    items: AdminMediaItem[];
    total: number;
    limit: number;
    offset: number;
  };
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} = {
  data: {
    items: mockMediaItems,
    total: 3,
    limit: 15,
    offset: 0,
  },
  isLoading: false,
  isError: false,
  error: null,
};

vi.mock('@/hooks/useAdmin', () => ({
  useAdminMediaList: vi.fn(() => mockListQueryState),
  useRatifyAdminMedia: () => ({
    mutateAsync: mockRatifyMutateAsync,
    isPending: false,
  }),
  useDeleteAdminMedia: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useUploadAdminMedia: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    hasPermission: mockHasPermission,
  }),
}));

vi.mock('@/components/ui/AudioPlayButton', () => ({
  AudioPlayButton: ({ trackId, lema }: { trackId: string; lema: string }) => (
    <button type="button" aria-label={`Reproducir ${lema}`} data-testid={`audio-${trackId}`}>
      Reproducir
    </button>
  ),
}));

describe('AdminMediaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation((perm: string) => {
      return perm === 'media:write' || perm === 'media:delete' || perm === 'media:read';
    });
    mockListQueryState = {
      data: {
        items: mockMediaItems,
        total: 3,
        limit: 15,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
    };
  });

  it('renderiza la cabecera, filtros y la tabla de medios culturales', () => {
    render(<AdminMediaPage />);

    expect(screen.getByText('Medios Culturales')).toBeDefined();
    expect(screen.getByText('Cargar medio')).toBeDefined();
    expect(screen.getByText('shoka_pronunciacion.mp3')).toBeDefined();
    expect(screen.getByText('Saludar ceremonialmente')).toBeDefined();
    expect(screen.getByText('Taita Lorenzo')).toBeDefined();
    expect(screen.getByText('Vestimenta tradicional')).toBeDefined();
    expect(screen.getByText('En revisión')).toBeDefined();
    expect(screen.getAllByText('Ratificado').length).toBeGreaterThanOrEqual(1);
  });

  it('oculta el botón "Cargar medio" si el usuario carece de permiso media:write', () => {
    mockHasPermission.mockImplementation((perm: string) => perm !== 'media:write');
    render(<AdminMediaPage />);

    expect(screen.queryByText('Cargar medio')).toBeNull();
  });

  it('permite abrir el modal de carga al pulsar "Cargar medio"', () => {
    render(<AdminMediaPage />);

    const btnCargar = screen.getByText('Cargar medio');
    fireEvent.click(btnCargar);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Cargar Medio Cultural')).toBeDefined();
  });

  it('permite ratificar un medio en estado borrador', async () => {
    mockRatifyMutateAsync.mockResolvedValueOnce({ ok: true });
    render(<AdminMediaPage />);

    const btnRatificar = screen.getByRole('button', { name: 'Ratificar' });
    fireEvent.click(btnRatificar);

    await waitFor(() => {
      expect(mockRatifyMutateAsync).toHaveBeenCalledWith('media-1');
    });
  });

  it('muestra diálogo de confirmación y permite eliminar un medio', async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce({ ok: true });
    render(<AdminMediaPage />);

    // Click en eliminar para el primer medio
    const btnsEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(btnsEliminar[0]);

    // Debe abrirse el diálogo de confirmación
    expect(screen.getByText('¿Eliminar recurso multimedia?')).toBeDefined();
    expect(screen.getAllByText('shoka_pronunciacion.mp3').length).toBeGreaterThanOrEqual(1);

    const btnConfirmar = screen.getByRole('button', { name: 'Sí, eliminar' });
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith('media-1');
    });
  });

  it('renderiza estado vacío cuando no hay medios registrados', () => {
    mockListQueryState = {
      data: {
        items: [],
        total: 0,
        limit: 15,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
    };

    render(<AdminMediaPage />);
    expect(
      screen.getByText('No se encontraron recursos multimedia con los filtros aplicados.'),
    ).toBeDefined();
  });

  it('renderiza estado de carga (spinner)', () => {
    mockListQueryState = {
      data: { items: [], total: 0, limit: 15, offset: 0 },
      isLoading: true,
      isError: false,
      error: null,
    };

    render(<AdminMediaPage />);
    expect(screen.getByText('Cargando catálogo multimedia...')).toBeDefined();
  });

  it('renderiza estado de error cuando falla la consulta', () => {
    mockListQueryState = {
      data: { items: [], total: 0, limit: 15, offset: 0 },
      isLoading: false,
      isError: true,
      error: new Error('Fallo de conexión al catálogo'),
    };

    render(<AdminMediaPage />);
    expect(
      screen.getByText(/Error al cargar los medios: Fallo de conexión al catálogo/i),
    ).toBeDefined();
  });

  it('permite filtrar por tipo, estado y realizar búsquedas por texto', () => {
    render(<AdminMediaPage />);

    const searchInput = screen.getByLabelText(/Buscar por texto/i);
    fireEvent.change(searchInput, { target: { value: 'Guambía' } });

    const tipoSelect = screen.getByLabelText(/Tipo de Medio/i);
    fireEvent.change(tipoSelect, { target: { value: 'imagen' } });

    const estadoSelect = screen.getByLabelText(/Estado Editorial/i);
    fireEvent.change(estadoSelect, { target: { value: 'ratificado' } });

    expect((searchInput as HTMLInputElement).value).toBe('Guambía');
    expect((tipoSelect as HTMLSelectElement).value).toBe('imagen');
    expect((estadoSelect as HTMLSelectElement).value).toBe('ratificado');
  });

  it('permite interactuar con la paginación', () => {
    mockListQueryState = {
      data: {
        items: mockMediaItems,
        total: 35,
        limit: 15,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
    };

    render(<AdminMediaPage />);

    const btnSiguiente = screen.getByRole('button', { name: 'Siguiente' });
    expect(btnSiguiente.getAttribute('disabled')).toBeNull();
    fireEvent.click(btnSiguiente);

    const btnAnterior = screen.getByRole('button', { name: 'Anterior' });
    expect(btnAnterior).toBeDefined();
  });

  it('permite previsualizar una imagen abriendo el lightbox', () => {
    render(<AdminMediaPage />);

    const btnPreview = screen.getByLabelText(/Ver imagen Ilustración del traje tradicional Misak/i);
    fireEvent.click(btnPreview);

    // Lightbox se abre
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('renderiza videos culturales con insignia Video, filtro dedicado y apertura en Lightbox', () => {
    render(<AdminMediaPage />);

    const tipoSelect = screen.getByLabelText(/Tipo de Medio/i) as HTMLSelectElement;
    fireEvent.change(tipoSelect, { target: { value: 'video' } });
    expect(tipoSelect.value).toBe('video');

    expect(screen.getByText('Video')).toBeDefined();
    expect(screen.getByText('minga_siembra.mp4')).toBeDefined();
    expect(screen.getByText(/45\.0 MB/i)).toBeDefined();

    const btnPreviewVideo = screen.getByLabelText(
      /Ver video Registro audiovisual de la minga comunitaria/i,
    );
    fireEvent.click(btnPreviewVideo);

    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('maneja el caso de cancelar la confirmación de eliminación', () => {
    render(<AdminMediaPage />);

    const btnsEliminar = screen.getAllByRole('button', { name: 'Eliminar' });
    fireEvent.click(btnsEliminar[0]);

    const btnCancelar = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(btnCancelar);

    expect(screen.queryByText('¿Eliminar recurso multimedia?')).toBeNull();
  });
});
