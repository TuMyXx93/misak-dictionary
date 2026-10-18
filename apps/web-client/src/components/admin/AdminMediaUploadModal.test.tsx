/**
 * AdminMediaUploadModal.test.tsx — Phase 5 · Spec 007
 *
 * Tests unitarios para el modal de carga de medios culturales (R-014):
 * - Cumplimiento WAI-ARIA (role="dialog", aria-modal="true").
 * - Validación de tamaño de archivo (10 MB máx).
 * - Envío de FormData con metadatos culturales y llamada a onSuccess.
 * - Cierre con tecla Escape o botón de cancelar.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMediaUploadModal } from './AdminMediaUploadModal';

const mockMutateAsync = vi.fn();

vi.mock('@/hooks/useAdmin', () => ({
  useUploadAdminMedia: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('AdminMediaUploadModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza contenido cuando isOpen es false', () => {
    render(<AdminMediaUploadModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza con atributos accesibles cuando isOpen es true', () => {
    render(<AdminMediaUploadModal isOpen={true} onClose={mockOnClose} sentidoLema="Shɵka" />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Cargar Medio Cultural')).toBeDefined();
    expect(screen.getByText('Shɵka')).toBeDefined();
  });

  it('cierra el diálogo al presionar la tecla Escape', () => {
    render(<AdminMediaUploadModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('valida el límite de tamaño de 10 MB para archivos multimedia', () => {
    render(<AdminMediaUploadModal isOpen={true} onClose={mockOnClose} />);

    const fileInput = screen.getByLabelText(/Archivo binario/i);
    // Archivo de 12 MB
    const largeFile = new File(['a'.repeat(1024)], 'audio_grande.mp3', {
      type: 'audio/mpeg',
    });
    Object.defineProperty(largeFile, 'size', { value: 12 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(
      screen.getByText('El archivo seleccionado supera el límite máximo permitido de 10 MB.'),
    ).toBeDefined();
  });

  it('permite alternar entre tipo Audio e Imagen cambiando los propósitos disponibles', () => {
    render(<AdminMediaUploadModal isOpen={true} onClose={mockOnClose} />);

    // Inicialmente es Audio
    expect(screen.getByText('Pronunciación estándar del lema')).toBeDefined();

    // Cambiar a Imagen
    const btnImagen = screen.getByRole('button', { name: /Ilustración \/ Imagen/i });
    fireEvent.click(btnImagen);

    expect(screen.getByText('Ilustración cultural tradicional')).toBeDefined();
  });

  it('envía los datos del formulario correctamente', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      data: { id: '1', uuid: 'uuid-1', filename: 'audio.mp3' },
    });

    render(
      <AdminMediaUploadModal
        isOpen={true}
        onClose={mockOnClose}
        sentidoId="100"
        onSuccess={mockOnSuccess}
      />,
    );

    const fileInput = screen.getByLabelText(/Archivo binario/i);
    const validFile = new File(['dummy audio content'], 'pronunciacion.mp3', {
      type: 'audio/mpeg',
    });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    const inputAutor = screen.getByLabelText(/Hablante \/ Autor/i);
    fireEvent.change(inputAutor, { target: { value: 'Mama Rosa' } });

    const btnSubmit = screen.getByRole('button', { name: 'Subir Medio Cultural' });
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockOnSuccess).toHaveBeenCalledWith({
      id: '1',
      uuid: 'uuid-1',
      filename: 'audio.mp3',
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
