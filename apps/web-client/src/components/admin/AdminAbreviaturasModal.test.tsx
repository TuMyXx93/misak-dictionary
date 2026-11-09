/**
 * AdminAbreviaturasModal.test.tsx
 * Tests unitarios para el modal administrativo CRUD de abreviaturas gramaticales:
 * - Renderizado accesible y catálogo de abreviaturas
 * - Filtrado y búsqueda por código y significado
 * - Validación y creación de abreviaturas con callback onSelectAbreviatura
 * - Edición, cancelación de edición y actualización exitosa
 * - Flujo de confirmación y borrado, protección ante elementos en uso
 * - Manejo de errores de API y permisos de usuario
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { PERMISSIONS } from '@/shared/permissions';
import { useAuthStore } from '@/stores/authStore';
import { AdminAbreviaturasModal } from './AdminAbreviaturasModal';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminAbreviaturas: vi.fn(),
  useCreateAbreviatura: vi.fn(),
  useUpdateAbreviatura: vi.fn(),
  useDeleteAbreviatura: vi.fn(),
}));

describe('AdminAbreviaturasModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSelectAbreviatura = vi.fn();
  const mockCreateMutateAsync = vi.fn();
  const mockUpdateMutateAsync = vi.fn();
  const mockDeleteMutateAsync = vi.fn();

  const mockItems: useAdminModule.AdminAbreviaturaItem[] = [
    {
      id: 'abrev-1',
      codigo: 's.',
      etiquetaCompleta: 'Sustantivo',
      orden: 1,
      activo: true,
      usosCount: 5,
      canDelete: false,
    },
    {
      id: 'abrev-2',
      codigo: 'v. tr.',
      etiquetaCompleta: 'Verbo transitivo',
      orden: 2,
      activo: true,
      usosCount: 0,
      canDelete: true,
    },
    {
      id: 'abrev-3',
      codigo: 'adj.',
      etiquetaCompleta: 'Adjetivo',
      orden: 3,
      activo: true,
      usosCount: 0,
      canDelete: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.getState().setSession(
      {
        userId: 'admin-1',
        email: 'admin@misak.edu.co',
        roles: ['super_admin'],
        permissions: [PERMISSIONS.DICCIONARIO_ESCRIBIR, PERMISSIONS.DICCIONARIO_BORRAR],
      },
      'token-test',
    );

    vi.mocked(useAdminModule.useAdminAbreviaturas).mockReturnValue({
      data: mockItems,
      isLoading: false,
    } as any);

    vi.mocked(useAdminModule.useCreateAbreviatura).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    } as any);

    vi.mocked(useAdminModule.useUpdateAbreviatura).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as any);

    vi.mocked(useAdminModule.useDeleteAbreviatura).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as any);
  });

  it('no renderiza nada cuando isOpen es false', () => {
    render(<AdminAbreviaturasModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza la lista de abreviaturas y descripción cuando isOpen es true', () => {
    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /gestión de abreviaturas gramaticales/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('s.')).toBeInTheDocument();
    expect(screen.getByText('Sustantivo')).toBeInTheDocument();
    expect(screen.getByText('5 término(s)')).toBeInTheDocument();
    expect(screen.getByText('Verbo transitivo')).toBeInTheDocument();
  });

  it('muestra estado de carga cuando isLoading es true', () => {
    vi.mocked(useAdminModule.useAdminAbreviaturas).mockReturnValue({
      data: [],
      isLoading: true,
    } as any);

    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText(/cargando catálogo de abreviaturas/i)).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay resultados de búsqueda', async () => {
    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByLabelText(/listado de abreviaturas/i);
    await userEvent.type(searchInput, 'inexistente');

    expect(
      screen.getByText(/no se encontraron abreviaturas con ese criterio/i),
    ).toBeInTheDocument();
  });

  it('filtra correctamente por código o significado', async () => {
    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByPlaceholderText(/filtrar por código o significado/i);
    await userEvent.type(searchInput, 'Adjetivo');

    expect(screen.getByText('adj.')).toBeInTheDocument();
    expect(screen.queryByText('Sustantivo')).not.toBeInTheDocument();
  });

  it('permite seleccionar una abreviatura con onSelectAbreviatura', async () => {
    render(
      <AdminAbreviaturasModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectAbreviatura={mockOnSelectAbreviatura}
      />,
    );

    const selectButtons = screen.getAllByRole('button', { name: /seleccionar/i });
    expect(selectButtons.length).toBeGreaterThan(0);

    await userEvent.click(selectButtons[0]);

    expect(mockOnSelectAbreviatura).toHaveBeenCalledWith('s.');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('valida campos obligatorios al intentar enviar formulario vacío', async () => {
    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    const form = screen.getByRole('button', { name: /\+ agregar/i }).closest('form')!;
    fireEvent.submit(form);

    expect(
      await screen.findByText(/el código y el significado completo son obligatorios/i),
    ).toBeInTheDocument();
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('crea una nueva abreviatura exitosamente y reinicia el formulario', async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({
      id: 'abrev-new',
      codigo: 'pron.',
      etiquetaCompleta: 'Pronombre',
    });

    render(
      <AdminAbreviaturasModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectAbreviatura={mockOnSelectAbreviatura}
      />,
    );

    const codigoInput = screen.getByLabelText(/abreviatura \/ código/i);
    const etiquetaInput = screen.getByLabelText(/significado completo/i);

    await userEvent.type(codigoInput, 'pron.');
    await userEvent.type(etiquetaInput, 'Pronombre');

    const submitBtn = screen.getByRole('button', { name: /crear y usar/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        codigo: 'pron.',
        etiquetaCompleta: 'Pronombre',
      });
      expect(mockOnSelectAbreviatura).toHaveBeenCalledWith('pron.');
      expect(screen.getByText(/creada correctamente/i)).toBeInTheDocument();
    });
  });

  it('muestra error cuando la creación de abreviatura falla', async () => {
    mockCreateMutateAsync.mockRejectedValueOnce(new Error('Código duplicado en base de datos'));

    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    await userEvent.type(screen.getByLabelText(/abreviatura \/ código/i), 's.');
    await userEvent.type(screen.getByLabelText(/significado completo/i), 'Sustantivo');

    await userEvent.click(screen.getByRole('button', { name: /\+ agregar/i }));

    expect(await screen.findByText(/código duplicado en base de datos/i)).toBeInTheDocument();
  });

  it('permite iniciar edición, cancelar edición y actualizar abreviatura', async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({
      id: 'abrev-2',
      codigo: 'v. trans.',
      etiquetaCompleta: 'Verbo transitivo extendido',
    });

    render(
      <AdminAbreviaturasModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectAbreviatura={mockOnSelectAbreviatura}
      />,
    );

    const editBtn = screen.getByLabelText('Editar abreviatura v. tr.');
    await userEvent.click(editBtn);

    expect(screen.getByText(/editar abreviatura seleccionada/i)).toBeInTheDocument();
    const codigoInput = screen.getByLabelText(/abreviatura \/ código/i) as HTMLInputElement;
    expect(codigoInput.value).toBe('v. tr.');

    // Probar cancelar edición
    const cancelEditBtn = screen.getByRole('button', { name: /cancelar edición/i });
    await userEvent.click(cancelEditBtn);
    expect(screen.getByText(/agregar nueva abreviatura/i)).toBeInTheDocument();
    expect(codigoInput.value).toBe('');

    // Volver a editar y enviar
    await userEvent.click(editBtn);
    await userEvent.clear(codigoInput);
    await userEvent.type(codigoInput, 'v. trans.');

    const updateBtn = screen.getByRole('button', { name: /actualizar/i });
    await userEvent.click(updateBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 'abrev-2',
        codigo: 'v. trans.',
        etiquetaCompleta: 'Verbo transitivo',
      });
      expect(mockOnSelectAbreviatura).toHaveBeenCalledWith('v. trans.');
      expect(screen.getByText(/actualizada correctamente/i)).toBeInTheDocument();
    });
  });

  it('deshabilita el botón de eliminar para abreviaturas protegidas con términos activos', () => {
    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    const deleteBtn = screen.getByLabelText('Eliminar abreviatura s.');
    expect(deleteBtn).toBeDisabled();
    expect(deleteBtn).toHaveAttribute(
      'title',
      expect.stringContaining('en uso por 5 forma(s) léxica(s)'),
    );
  });

  it('permite confirmar y eliminar una abreviatura no protegida', async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce({ success: true });

    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    const deleteBtn = screen.getByLabelText('Eliminar abreviatura v. tr.');
    expect(deleteBtn).not.toBeDisabled();

    await userEvent.click(deleteBtn);

    // Debe aparecer diálogo de confirmación
    const alertDialog = screen.getByRole('alertdialog');
    expect(alertDialog).toBeInTheDocument();
    expect(
      screen.getByText(/¿eliminar la abreviatura «v\. tr\. — verbo transitivo»\?/i),
    ).toBeInTheDocument();

    // Probar cancelar borrado
    const cancelDeleteBtn = screen.getByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelDeleteBtn);
    expect(screen.queryByRole('alertdialog')).toBeNull();

    // Volver a solicitar borrado y confirmar
    await userEvent.click(deleteBtn);
    const confirmDeleteBtn = screen.getByRole('button', { name: /confirmar borrado/i });
    await userEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith('abrev-2');
      expect(screen.getByText(/eliminada correctamente/i)).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error si el borrado de una abreviatura falla', async () => {
    mockDeleteMutateAsync.mockRejectedValueOnce(new Error('Abreviatura con dependencias'));

    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    const deleteBtn = screen.getByLabelText('Eliminar abreviatura adj.');
    await userEvent.click(deleteBtn);

    const confirmDeleteBtn = screen.getByRole('button', { name: /confirmar borrado/i });
    await userEvent.click(confirmDeleteBtn);

    expect(await screen.findByText(/abreviatura con dependencias/i)).toBeInTheDocument();
  });

  it('oculta el formulario si el usuario no tiene permiso de escritura', () => {
    useAuthStore.getState().setSession(
      {
        userId: 'lector-1',
        email: 'lector@misak.edu.co',
        roles: ['lector'],
        permissions: [],
      },
      'token-test',
    );

    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.queryByText(/agregar nueva abreviatura/i)).toBeNull();
    expect(screen.queryByLabelText(/abreviatura \/ código/i)).toBeNull();
  });

  it('cierra el diálogo al hacer clic en el botón Cerrar del pie', async () => {
    render(<AdminAbreviaturasModal isOpen={true} onClose={mockOnClose} />);

    const closeBtn = screen.getByRole('button', { name: /^cerrar$/i });
    await userEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
