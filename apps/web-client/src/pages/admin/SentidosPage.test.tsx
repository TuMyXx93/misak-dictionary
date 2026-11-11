import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/authStore';
import { SentidosPage } from './SentidosPage';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminSentidos: vi.fn(),
  useDeleteSentido: vi.fn(),
  useAdminAbreviaturas: vi.fn(),
  useCreateAbreviatura: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateAbreviatura: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteAbreviatura: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

describe('SentidosPage (T-043, R-006)', () => {
  const mockSentidosData = {
    items: [
      {
        id: 's-1',
        codigo: 'C1.S1.M1.E001',
        lema: 'mɵi',
        glosa: 'persona / gente',
        estado: 'ratificado' as const,
        version: 2,
        tipo: 'termino',
        updatedAt: '2026-10-15T12:00:00Z',
      },
      {
        id: 's-2',
        codigo: 'C1.S1.M1.E002',
        lema: 'piurek',
        glosa: 'río / corriente de agua',
        estado: 'borrador' as const,
        version: 1,
        tipo: 'termino',
        updatedAt: '2026-10-16T12:00:00Z',
      },
    ],
    nextCursor: 'cursor-abc-123',
  };

  const mockDeleteMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setSession(
      {
        userId: 'u1',
        email: 'admin@namtrik.org',
        roles: ['content_admin', 'cultural_reviewer'],
        permissions: [
          'dictionary:read',
          'dictionary:write',
          'dictionary:delete',
          'taxonomy:ratify',
        ],
      },
      'token-xyz',
    );

    vi.mocked(useAdminModule.useAdminSentidos).mockReturnValue({
      data: mockSentidosData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModule.useAdminSentidos>);

    vi.mocked(useAdminModule.useDeleteSentido).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useDeleteSentido>);

    vi.mocked(useAdminModule.useAdminAbreviaturas).mockReturnValue({
      data: [
        { id: '1', codigo: 's.', etiquetaCompleta: 'Sustantivo', orden: 1, activo: true },
        { id: '2', codigo: 'v.', etiquetaCompleta: 'Verbo', orden: 2, activo: true },
      ],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useAdminModule.useAdminAbreviaturas>);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <SentidosPage />
      </BrowserRouter>,
    );

  it('renderiza la lista de sentidos con lema Namtrik, código, glosa, estado y versión', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /gestión de sentidos léxicos/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('C1.S1.M1.E001')).toBeInTheDocument();
    expect(screen.getByText('mɵi')).toBeInTheDocument();
    expect(screen.getByText('persona / gente')).toBeInTheDocument();
    expect(screen.getAllByText('Ratificado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/v2/)).toBeInTheDocument();

    expect(screen.getByText('C1.S1.M1.E002')).toBeInTheDocument();
    expect(screen.getByText('piurek')).toBeInTheDocument();
    expect(screen.getAllByText('Borrador').length).toBeGreaterThanOrEqual(1);
  });

  it('permite filtrar por estado y búsqueda de texto', async () => {
    renderComponent();

    const searchInput = screen.getByLabelText(/buscar texto \/ lema/i);
    await userEvent.type(searchInput, 'piurek');

    expect(useAdminModule.useAdminSentidos).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'piurek',
      }),
    );

    const estadoSelect = screen.getByLabelText(/estado editorial/i);
    await userEvent.selectOptions(estadoSelect, 'borrador');

    expect(useAdminModule.useAdminSentidos).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'borrador',
      }),
    );
  });

  it('abre diálogo de confirmación al presionar eliminar y llama a useDeleteSentido', async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce({ success: true });
    renderComponent();

    const deleteBtn = screen.getByRole('button', {
      name: /eliminar sentido C1.S1.M1.E001/i,
    });
    await userEvent.click(deleteBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/¿mover sentido a la papelera\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', {
      name: /confirmar eliminación/i,
    });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: 's-1' });
    });
  });
});
