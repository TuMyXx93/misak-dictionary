import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useAdminModule from '@/hooks/useAdmin';
import { AdminApiError } from '@/services/adminHttp';
import { useAuthStore } from '@/stores/authStore';
import { TaxonomiaAdminPage } from './TaxonomiaAdminPage';

vi.mock('@/hooks/useAdmin', () => ({
  useAdminTaxonomiaArbol: vi.fn(),
  useCreateCampo: vi.fn(),
  useUpdateCampo: vi.fn(),
  useDeleteCampo: vi.fn(),
  useCreateSubcampo: vi.fn(),
  useUpdateSubcampo: vi.fn(),
  useDeleteSubcampo: vi.fn(),
  useCreateMicrocampo: vi.fn(),
  useUpdateMicrocampo: vi.fn(),
  useDeleteMicrocampo: vi.fn(),
}));

describe('TaxonomiaAdminPage (Spec 012 v0.2.0 - Gestión Taxonómica y 409 Conflict)', () => {
  const mockTreeData: useAdminModule.AdminTaxonomyNode[] = [
    {
      id: 'c-1',
      codigo: 'C1',
      slug: 'ya',
      namtrikTermino: 'Yá',
      espanolTermino: 'Naturaleza y Cosmos',
      posicion: 1,
      nivel: 'campo',
      totalTerminos: 31,
      totalHijos: 1,
      hijos: [
        {
          id: 's-1',
          codigo: 'C1.S1',
          slug: 'nakchak',
          namtrikTermino: 'Nakchak',
          espanolTermino: 'Territorio y Hábitat',
          posicion: 1,
          nivel: 'subcampo',
          totalTerminos: 31,
          totalHijos: 1,
          hijos: [
            {
              id: 'm-1',
              codigo: 'C1.S1.M1',
              slug: 'wammera',
              namtrikTermino: 'Wammera',
              espanolTermino: 'Lengua y Memoria',
              posicion: 1,
              nivel: 'microcampo',
              totalTerminos: 7,
              totalHijos: 0,
            },
          ],
        },
      ],
    },
  ];

  const mockDeleteCampo = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.getState().setSession(
      {
        userId: 'u1',
        email: 'admin@namtrik.org',
        roles: ['super_admin'],
        permissions: ['dictionary:read', 'dictionary:write', 'dictionary:delete'],
      },
      'token-xyz',
    );

    vi.mocked(useAdminModule.useAdminTaxonomiaArbol).mockReturnValue({
      data: mockTreeData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAdminModule.useAdminTaxonomiaArbol>);

    vi.mocked(useAdminModule.useDeleteCampo).mockReturnValue({
      mutateAsync: mockDeleteCampo,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useDeleteCampo>);
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza el árbol taxonómico con conteo de términos e insignias de nivel', () => {
    render(<TaxonomiaAdminPage />);

    expect(
      screen.getByRole('heading', { name: /gestión de taxonomía y jerarquías/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
    expect(screen.getByText('Yá')).toBeInTheDocument();
    expect(screen.getByText(/naturaleza y cosmos/i)).toBeInTheDocument();
    expect(screen.getByText(/31 términos/i)).toBeInTheDocument();
    expect(screen.getByText(/Nivel 1 · Campo/i)).toBeInTheDocument();
  });

  it('permite expandir el campo y visualizar subcampos y microcampos con sus semáforos', async () => {
    render(<TaxonomiaAdminPage />);

    const expandBtn = screen.getByRole('button', { name: /expandir nodo/i });
    await userEvent.click(expandBtn);

    expect(screen.getByText('C1.S1')).toBeInTheDocument();
    expect(screen.getByText(/Nivel 2 · Subcampo/i)).toBeInTheDocument();
    expect(screen.getByText('Nakchak')).toBeInTheDocument();

    const expandSubBtn = screen.getAllByRole('button', { name: /expandir nodo/i })[0];
    await userEvent.click(expandSubBtn);

    expect(screen.getByText('C1.S1.M1')).toBeInTheDocument();
    expect(screen.getByText(/Nivel 3 · Microcampo/i)).toBeInTheDocument();
    expect(screen.getByText('Wammera')).toBeInTheDocument();
  });

  it('muestra mensaje claro de bloqueo 409 cuando el backend rechaza la eliminación por dependencias activas', async () => {
    const error409 = new AdminApiError(
      409,
      'No es posible eliminar el campo "C1": contiene 1 subcampos activos.',
      'Conflict',
    );
    mockDeleteCampo.mockRejectedValueOnce(error409);

    render(<TaxonomiaAdminPage />);

    const deleteBtn = screen.getByRole('button', { name: /eliminar c1/i });
    await userEvent.click(deleteBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/¿eliminar nodo c1\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirmar eliminación/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/no es posible eliminar el campo "c1": contiene 1 subcampos activos/i),
      ).toBeInTheDocument();
    });
  });

  it('abre el modal de creación y permite guardar un nuevo campo taxonómico', async () => {
    const mockCreateCampo = vi.fn().mockResolvedValueOnce({ success: true });
    vi.mocked(useAdminModule.useCreateCampo).mockReturnValue({
      mutateAsync: mockCreateCampo,
      isPending: false,
    } as unknown as ReturnType<typeof useAdminModule.useCreateCampo>);

    render(<TaxonomiaAdminPage />);

    const newBtn = screen.getByRole('button', { name: /\+ nuevo campo \(nivel 1\)/i });
    await userEvent.click(newBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/crear CAMPO taxonómico/i)).toBeInTheDocument();

    const codigoInput = screen.getByPlaceholderText(/ej: c1, c1\.s1/i);
    const slugInput = screen.getByLabelText(/slug url/i);
    const espanolInput = screen.getByLabelText(/término \(castellano\)/i);

    await userEvent.type(codigoInput, 'C2');
    await userEvent.type(slugInput, 'cultura');
    await userEvent.type(espanolInput, 'Cultura Misak');

    const saveBtn = screen.getByRole('button', { name: /guardar nodo/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockCreateCampo).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: 'C2',
          slug: 'cultura',
          espanolTermino: 'Cultura Misak',
        }),
      );
    });
  });
});
